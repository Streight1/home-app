import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  expeditionsInvalid,
  expeditionsNotFound,
} from '../domain/expeditions.errors.js';
import {
  dateOnly,
  EXPEDITIONS_ADMIN_ROLE,
  EXPEDITIONS_READ_ROLE,
  EXPEDITIONS_WRITE_ROLE,
  optionalText,
} from '../domain/expeditions.types.js';
import type {
  TripInputDto,
  TripParticipantInputDto,
} from '../presentation/dto/trip.dto.js';
import { mapTrip, tripInclude } from './expeditions-response.mapper.js';
import { PackTemplatesService } from './pack-templates.service.js';

@Injectable()
export class TripsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly templates: PackTemplatesService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    return (
      await this.prisma.trip.findMany({
        where: { householdId: membership.householdId, archivedAt: null },
        include: tripInclude,
        orderBy: [{ startsOn: 'asc' }, { createdAt: 'desc' }],
      })
    ).map(mapTrip);
  }

  public async detail(userId: string, tripId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    return mapTrip(await this.find(membership.householdId, tripId));
  }

  public async create(userId: string, input: TripInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    this.validateDates(input);
    await this.validateParticipants(membership.householdId, input.participants);
    const template = input.templateId
      ? await this.templates.find(membership.householdId, input.templateId)
      : null;
    const participantIds = new Set(
      input.participants.map(({ userId: participantId }) => participantId),
    );
    const record = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          householdId: membership.householdId,
          ...this.data(input),
          createdFromTemplateId: template?.id ?? null,
          createdByUserId: userId,
          updatedByUserId: userId,
          participants: {
            create: input.participants.map((participant) => ({
              userId: participant.userId,
              role: participant.role,
              createdByUserId: userId,
            })),
          },
          ...(template
            ? {
                packItems: {
                  create: template.items.map((item) => ({
                    sourceTemplateItemId: item.id,
                    gearItemId: item.gearItemId,
                    nameSnapshot: item.nameSnapshot,
                    categoryNameSnapshot: item.categoryNameSnapshot,
                    quantityDecimal: item.quantityDecimal,
                    unitWeightGramsSnapshot: item.unitWeightGramsSnapshot,
                    loadType: item.loadType,
                    criticality: item.criticality,
                    isShared: item.isShared,
                    assignedUserId:
                      item.defaultAssignedUserId &&
                      participantIds.has(item.defaultAssignedUserId)
                        ? item.defaultAssignedUserId
                        : null,
                    packLocationLabel: item.packLocationLabel,
                    notes: item.notes,
                    sortOrder: item.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: tripInclude,
      });
      await this.audit.record(tx, {
        action: 'TRIP_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: trip.id,
        metadata: {
          participantCount: input.participants.length,
          itemCount: trip.packItems.length,
          fromTemplate: Boolean(template),
        },
      });
      return trip;
    });
    return mapTrip(record);
  }

  public async update(userId: string, tripId: string, input: TripInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, tripId);
    this.validateDates(input);
    await this.validateParticipants(membership.householdId, input.participants);
    return this.prisma.$transaction(async (tx) => {
      const retainedIds = input.participants.map(({ userId: id }) => id);
      await tx.tripParticipant.deleteMany({ where: { tripId } });
      await tx.tripPackItem.updateMany({
        where: {
          tripId,
          assignedUserId: { notIn: retainedIds },
        },
        data: { assignedUserId: null },
      });
      const trip = await tx.trip.update({
        where: { id: tripId },
        data: {
          ...this.data(input),
          updatedByUserId: userId,
          participants: {
            create: input.participants.map((participant) => ({
              userId: participant.userId,
              role: participant.role,
              createdByUserId: userId,
            })),
          },
        },
        include: tripInclude,
      });
      await this.audit.record(tx, {
        action: 'TRIP_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
      });
      return mapTrip(trip);
    });
  }

  public async replaceParticipants(
    userId: string,
    tripId: string,
    participants: TripParticipantInputDto[],
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, tripId);
    await this.validateParticipants(membership.householdId, participants);
    await this.prisma.$transaction(async (tx) => {
      const retainedIds = participants.map(({ userId: id }) => id);
      await tx.tripParticipant.deleteMany({ where: { tripId } });
      await tx.tripParticipant.createMany({
        data: participants.map((participant) => ({
          tripId,
          userId: participant.userId,
          role: participant.role,
          createdByUserId: userId,
        })),
      });
      await tx.tripPackItem.updateMany({
        where: { tripId, assignedUserId: { notIn: retainedIds } },
        data: { assignedUserId: null },
      });
    });
    return this.detail(userId, tripId);
  }

  public async setArchived(userId: string, tripId: string, archived: boolean) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    await this.find(membership.householdId, tripId);
    await this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: archived ? 'ARCHIVED' : 'PLANNING',
          archivedAt: archived ? new Date() : null,
          updatedByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'TRIP_ARCHIVED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
      });
    });
    return this.detail(userId, tripId);
  }

  public async find(householdId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, householdId },
      include: tripInclude,
    });
    if (!trip) throw expeditionsNotFound();
    return trip;
  }

  private data(input: TripInputDto) {
    return {
      title: input.title.trim(),
      description: optionalText(input.description),
      tripType: input.tripType,
      startsOn: dateOnly(input.startsOn),
      endsOn: dateOnly(input.endsOn),
      locationLabel: optionalText(input.locationLabel),
      overnightCount: input.overnightCount,
      targetBaseWeightGrams: input.targetBaseWeightGrams ?? null,
      notes: optionalText(input.notes),
    };
  }

  private validateDates(input: TripInputDto) {
    if (input.endsOn < input.startsOn)
      throw expeditionsInvalid('Konec výpravy nesmí být před začátkem.');
    if (input.tripType === 'DAY_HIKE' && input.overnightCount !== 0)
      throw expeditionsInvalid('Jednodenní výlet nemůže mít přenocování.');
  }

  private async validateParticipants(
    householdId: string,
    participants: TripParticipantInputDto[],
  ) {
    const ids = participants.map(({ userId }) => userId);
    if (new Set(ids).size !== ids.length)
      throw expeditionsInvalid('Účastník může být ve výpravě pouze jednou.');
    if (!participants.some(({ role }) => role === 'ORGANIZER'))
      throw expeditionsInvalid('Výprava musí mít organizátora.');
    await this.access.assertActiveMembers(householdId, ids);
  }
}
