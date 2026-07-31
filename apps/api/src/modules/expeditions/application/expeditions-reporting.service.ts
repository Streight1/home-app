import { Injectable } from '@nestjs/common';
import { serializeDecimal } from '../../../common/numbers/decimal.js';
import { serializeDateOnly } from '../../../common/time/date-only.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { ExpeditionWeightService } from '../domain/expedition-weight.service.js';
import { expeditionsInvalid } from '../domain/expeditions.errors.js';
import {
  currentDateOnly,
  dateOnly,
  EXPEDITIONS_READ_ROLE,
  EXPEDITIONS_WRITE_ROLE,
} from '../domain/expeditions.types.js';
import { TripReadinessService } from '../domain/trip-readiness.service.js';
import { TripsService } from './trips.service.js';

@Injectable()
export class ExpeditionsReportingService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly trips: TripsService,
    private readonly weights: ExpeditionWeightService,
    private readonly readiness: TripReadinessService,
    private readonly audit: AuditService,
  ) {}

  public async summary(userId: string, tripId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    const items = trip.packItems.map((item) => ({
      id: item.id,
      name: item.nameSnapshot,
      categoryNameSnapshot: item.categoryNameSnapshot,
      assignedUserId: item.assignedUserId,
      quantity: serializeDecimal(item.quantityDecimal),
      unitWeightGrams: item.unitWeightGramsSnapshot,
      loadType: item.loadType,
      packingStatus: item.packingStatus,
      criticality: item.criticality,
      isShared: item.isShared,
      categoryName: item.categoryNameSnapshot,
    }));
    const weight = this.weights.calculate(items);
    const participantNames = new Map(
      trip.participants.map(({ user }) => [user.id, user.displayName]),
    );
    const readiness = this.readiness.evaluate(
      { tripType: trip.tripType },
      items,
      trip.readinessAcknowledgements.map(({ ruleCode }) => ruleCode),
    );
    return {
      ...weight,
      participantWeights: weight.participantWeights.map((participant) => ({
        ...participant,
        displayName:
          participant.key === 'unassigned'
            ? 'Bez přiřazení'
            : (participantNames.get(participant.key) ?? 'Člen domácnosti'),
      })),
      targetBaseWeightGrams: trip.targetBaseWeightGrams,
      baseWeightDifferenceGrams:
        trip.targetBaseWeightGrams === null
          ? null
          : weight.baseWeightGrams - trip.targetBaseWeightGrams,
      readiness,
      participants: trip.participants.map(({ user }) => ({
        id: user.id,
        displayName: user.displayName,
      })),
    };
  }

  public async markReady(userId: string, tripId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.trips.find(membership.householdId, tripId);
    const summary = await this.summary(userId, tripId);
    if (!summary.readiness.ready)
      throw expeditionsInvalid(
        'Výpravu nelze označit jako připravenou, dokud nejsou vyřešené všechny povinné položky a jejich nositelé.',
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: 'READY', updatedByUserId: userId },
      });
      await this.audit.record(tx, {
        action: 'TRIP_MARKED_READY',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async complete(userId: string, tripId: string, confirmed: boolean) {
    if (!confirmed)
      throw expeditionsInvalid('Dokončení výpravy vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.trips.find(membership.householdId, tripId);
    await this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED', updatedByUserId: userId },
      });
      await this.audit.record(tx, {
        action: 'TRIP_COMPLETED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async acknowledgeRule(
    userId: string,
    tripId: string,
    ruleCode: string,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.trips.find(membership.householdId, tripId);
    const summary = await this.summary(userId, tripId);
    if (!summary.readiness.advisoryRules.some(({ code }) => code === ruleCode))
      throw expeditionsInvalid('Kontrolní pravidlo není pro výpravu platné.');
    await this.prisma.tripReadinessAcknowledgement.upsert({
      where: { tripId_ruleCode: { tripId, ruleCode } },
      create: { tripId, ruleCode, acknowledgedByUserId: userId },
      update: { acknowledgedByUserId: userId, acknowledgedAt: new Date() },
    });
    return this.summary(userId, tripId);
  }

  public async dashboard(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const trip = await this.prisma.trip.findFirst({
      where: {
        householdId: membership.householdId,
        archivedAt: null,
        status: { in: ['PLANNING', 'PACKING', 'READY'] },
        startsOn: { gte: dateOnly(currentDateOnly()) },
      },
      include: {
        packItems: true,
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
        readinessAcknowledgements: true,
      },
      orderBy: { startsOn: 'asc' },
    });
    if (!trip)
      return {
        nextTrip: null,
        navigationTarget: {
          area: 'expeditions' as const,
          screen: 'overview' as const,
        },
      };
    const summary = await this.summary(userId, trip.id);
    return {
      nextTrip: {
        id: trip.id,
        title: trip.title,
        startsOn: serializeDateOnly(trip.startsOn),
        status: trip.status,
        packedCount: summary.readiness.packedCount,
        totalCount: summary.readiness.totalCount,
        missingRequiredCount: summary.readiness.missingRequiredCount,
        baseWeightGrams: summary.baseWeightGrams,
        targetBaseWeightGrams: trip.targetBaseWeightGrams,
      },
      navigationTarget: {
        area: 'expeditions' as const,
        screen: 'trip' as const,
        tripId: trip.id,
      },
    };
  }
}
