import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  expeditionsInvalid,
  expeditionsNotFound,
} from '../domain/expeditions.errors.js';
import {
  DECIMAL_QUANTITY_PATTERN,
  dateOnlyString,
  EXPEDITIONS_WRITE_ROLE,
  optionalText,
} from '../domain/expeditions.types.js';
import type {
  CreateTripTaskDto,
  ApplyTripReviewToTemplateDto,
  TripPackItemInputDto,
  TripReviewItemDto,
} from '../presentation/dto/trip.dto.js';
import { ExpeditionWeightService } from '../domain/expedition-weight.service.js';
import { TripsService } from './trips.service.js';
import { PackTemplatesService } from './pack-templates.service.js';

@Injectable()
export class TripPackingService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly trips: TripsService,
    private readonly templates: PackTemplatesService,
    private readonly tasks: TasksFacade,
    private readonly audit: AuditService,
    private readonly weights: ExpeditionWeightService,
  ) {}

  public async applyTemplate(
    userId: string,
    tripId: string,
    templateId: string,
    confirmed: boolean,
  ) {
    if (!confirmed)
      throw expeditionsInvalid('Použití šablony vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    const template = await this.templates.find(
      membership.householdId,
      templateId,
    );
    const participantIds = new Set(
      trip.participants.map(({ userId: participantId }) => participantId),
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.tripPackItem.deleteMany({ where: { tripId } });
      await tx.tripPackItem.createMany({
        data: template.items.map((item) => ({
          tripId,
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
      });
      await tx.trip.update({
        where: { id: tripId },
        data: {
          createdFromTemplateId: templateId,
          updatedByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'TRIP_TEMPLATE_APPLIED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
        metadata: { itemCount: template.items.length },
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async replaceItems(
    userId: string,
    tripId: string,
    inputs: TripPackItemInputDto[],
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    const existingIds = new Set(trip.packItems.map(({ id }) => id));
    const providedIds = inputs.flatMap(({ id }) => (id ? [id] : []));
    if (
      new Set(providedIds).size !== providedIds.length ||
      providedIds.some((id) => !existingIds.has(id))
    )
      throw expeditionsNotFound();
    const resolved = await this.resolveItems(
      membership.householdId,
      new Set(trip.participants.map(({ userId: id }) => id)),
      inputs,
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.tripPackItem.updateMany({
        where: { tripId },
        data: { sortOrder: { increment: 10_000 } },
      });
      await tx.tripPackItem.deleteMany({
        where: {
          tripId,
          ...(providedIds.length ? { id: { notIn: providedIds } } : {}),
        },
      });
      for (const [sortOrder, item] of resolved.entries()) {
        if (item.id) {
          await tx.tripPackItem.update({
            where: { id: item.id },
            data: {
              ...item.data,
              sortOrder,
              packedAt:
                item.data.packingStatus === 'PACKED' ? new Date() : null,
              packedByUserId:
                item.data.packingStatus === 'PACKED' ? userId : null,
            },
          });
        } else {
          await tx.tripPackItem.create({
            data: {
              tripId,
              ...item.data,
              sortOrder,
              packedAt:
                item.data.packingStatus === 'PACKED' ? new Date() : null,
              packedByUserId:
                item.data.packingStatus === 'PACKED' ? userId : null,
            },
          });
        }
      }
      await this.audit.record(tx, {
        action: 'TRIP_PACK_ITEMS_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
        metadata: { itemCount: inputs.length },
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async updatePackingStatus(
    userId: string,
    tripId: string,
    itemIds: string[],
    status: 'PLANNED' | 'PACKED' | 'MISSING' | 'EXCLUDED',
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.trips.find(membership.householdId, tripId);
    const count = await this.prisma.tripPackItem.count({
      where: { tripId, id: { in: itemIds } },
    });
    if (count !== new Set(itemIds).size) throw expeditionsNotFound();
    await this.prisma.$transaction(async (tx) => {
      await tx.tripPackItem.updateMany({
        where: { tripId, id: { in: itemIds } },
        data: {
          packingStatus: status,
          packedAt: status === 'PACKED' ? new Date() : null,
          packedByUserId: status === 'PACKED' ? userId : null,
        },
      });
      await tx.trip.update({
        where: { id: tripId },
        data: {
          ...(status === 'PACKED' ? { status: 'PACKING' as const } : {}),
          updatedByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'TRIP_PACKING_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
        metadata: { itemCount: itemIds.length, status },
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async review(
    userId: string,
    tripId: string,
    items: TripReviewItemDto[],
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    const itemIds = new Set(trip.packItems.map(({ id }) => id));
    if (items.some(({ itemId }) => !itemIds.has(itemId)))
      throw expeditionsNotFound();
    await this.prisma.$transaction(async (tx) => {
      for (const item of items)
        await tx.tripPackItem.update({
          where: { id: item.itemId },
          data: {
            reviewOutcome: item.outcome,
            reviewNotes: optionalText(item.notes),
          },
        });
      await this.audit.record(tx, {
        action: 'TRIP_GEAR_REVIEWED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
        metadata: {
          reviewedCount: items.length,
          unusedCount: items.filter(({ outcome }) => outcome === 'UNUSED')
            .length,
          missingCount: items.filter(
            ({ outcome }) => outcome === 'MISSING_DURING_TRIP',
          ).length,
          brokenCount: items.filter(({ outcome }) => outcome === 'BROKEN')
            .length,
        },
      });
    });
    return this.trips.detail(userId, tripId);
  }

  public async templateReviewPreview(userId: string, tripId: string) {
    const membership = await this.access.getActiveMembership(userId, 'VIEWER');
    const trip = await this.trips.find(membership.householdId, tripId);
    if (!trip.createdFromTemplateId)
      return {
        available: false,
        templateId: null,
        templateName: null,
        remove: [],
        add: [],
      };
    const template = await this.templates.find(
      membership.householdId,
      trip.createdFromTemplateId,
    );
    const templateItemIds = new Set(template.items.map(({ id }) => id));
    return {
      available: true,
      templateId: template.id,
      templateName: template.name,
      remove: trip.packItems
        .filter(
          (item) =>
            item.reviewOutcome === 'UNUSED' &&
            item.sourceTemplateItemId !== null &&
            templateItemIds.has(item.sourceTemplateItemId),
        )
        .map((item) => ({
          tripItemId: item.id,
          templateItemId: item.sourceTemplateItemId,
          name: item.nameSnapshot,
          weightGrams: this.itemWeightGrams(item),
        })),
      add: trip.packItems
        .filter(
          (item) =>
            item.reviewOutcome === 'MISSING_DURING_TRIP' &&
            (item.sourceTemplateItemId === null ||
              !templateItemIds.has(item.sourceTemplateItemId)),
        )
        .map((item) => ({
          tripItemId: item.id,
          name: item.nameSnapshot,
          weightGrams: this.itemWeightGrams(item),
        })),
    };
  }

  public async applyReviewToTemplate(
    userId: string,
    tripId: string,
    input: ApplyTripReviewToTemplateDto,
  ) {
    if (!input.confirmed)
      throw expeditionsInvalid('Změna gearlistu vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    if (!trip.createdFromTemplateId)
      throw expeditionsInvalid('Výprava nevznikla z gearlistu.');
    const templateId = trip.createdFromTemplateId;
    const preview = await this.templateReviewPreview(userId, tripId);
    const removable = new Map(
      preview.remove.map((item) => [item.tripItemId, item.templateItemId]),
    );
    const addable = new Set(preview.add.map(({ tripItemId }) => tripItemId));
    if (
      input.removeTripItemIds.some((id) => !removable.has(id)) ||
      input.addTripItemIds.some((id) => !addable.has(id))
    )
      throw expeditionsInvalid(
        'Návrh gearlistu se změnil. Zkontrolujte jej znovu.',
      );
    const additions = trip.packItems.filter(({ id }) =>
      input.addTripItemIds.includes(id),
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.packTemplateItem.deleteMany({
        where: {
          packTemplateId: templateId,
          id: {
            in: input.removeTripItemIds.flatMap((id) => {
              const templateItemId = removable.get(id);
              return templateItemId ? [templateItemId] : [];
            }),
          },
        },
      });
      const current = await tx.packTemplateItem.findMany({
        where: { packTemplateId: templateId },
        orderBy: { sortOrder: 'asc' },
      });
      await tx.packTemplateItem.updateMany({
        where: { packTemplateId: templateId },
        data: { sortOrder: { increment: 10_000 } },
      });
      for (const [sortOrder, item] of current.entries())
        await tx.packTemplateItem.update({
          where: { id: item.id },
          data: { sortOrder },
        });
      for (const [offset, item] of additions.entries())
        await tx.packTemplateItem.create({
          data: {
            packTemplateId: templateId,
            gearItemId: item.gearItemId,
            nameSnapshot: item.nameSnapshot,
            customName: item.gearItemId ? null : item.nameSnapshot,
            categoryNameSnapshot: item.categoryNameSnapshot,
            quantityDecimal: item.quantityDecimal,
            unitWeightGramsSnapshot: item.unitWeightGramsSnapshot,
            loadType: item.loadType,
            criticality: item.criticality,
            isShared: item.isShared,
            defaultAssignedUserId: item.assignedUserId,
            packLocationLabel: item.packLocationLabel,
            notes: item.notes,
            sortOrder: current.length + offset,
          },
        });
      await this.audit.record(tx, {
        action: 'PACK_TEMPLATE_REVIEW_APPLIED',
        householdId: membership.householdId,
        userId,
        entityType: 'PackTemplate',
        entityId: templateId,
        metadata: {
          removedCount: input.removeTripItemIds.length,
          addedCount: input.addTripItemIds.length,
        },
      });
    });
    return this.templates.detail(userId, templateId);
  }

  public async createTask(
    userId: string,
    tripId: string,
    input: CreateTripTaskDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const trip = await this.trips.find(membership.householdId, tripId);
    const item = input.itemId
      ? trip.packItems.find(({ id }) => id === input.itemId)
      : null;
    if (input.itemId && !item) throw expeditionsNotFound();
    const assignedToUserId =
      item?.assignedUserId ?? trip.participants[0]?.userId ?? null;
    const task = await this.tasks.createForExpedition({
      userId,
      title: input.title.trim(),
      description: `Navázáno na výpravu ${trip.title}.`,
      assignedToUserId,
      dueDate: dateOnlyString(trip.startsOn),
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.tripTaskLink.create({
        data: {
          tripId,
          tripPackItemId: item?.id ?? null,
          taskId: task.id,
          createdByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'TRIP_TASK_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Trip',
        entityId: tripId,
        metadata: { linkedToPackItem: Boolean(item) },
      });
    });
    return { taskId: task.id };
  }

  public async catalogUpdatePreview(userId: string, tripId: string) {
    const membership = await this.access.getActiveMembership(userId, 'VIEWER');
    const trip = await this.trips.find(membership.householdId, tripId);
    const gear = await this.prisma.gearItem.findMany({
      where: {
        householdId: membership.householdId,
        id: {
          in: trip.packItems.flatMap(({ gearItemId }) =>
            gearItemId ? [gearItemId] : [],
          ),
        },
      },
      include: { category: true },
    });
    const byId = new Map(gear.map((item) => [item.id, item]));
    return {
      changes: trip.packItems.flatMap((item) => {
        const current = item.gearItemId ? byId.get(item.gearItemId) : null;
        if (!current) return [];
        const changed =
          current.name !== item.nameSnapshot ||
          current.weightGrams !== item.unitWeightGramsSnapshot ||
          current.category?.name !== item.categoryNameSnapshot;
        return changed
          ? [
              {
                itemId: item.id,
                name: { before: item.nameSnapshot, after: current.name },
                weightGrams: {
                  before: item.unitWeightGramsSnapshot,
                  after: current.weightGrams,
                },
                categoryName: {
                  before: item.categoryNameSnapshot,
                  after: current.category?.name ?? null,
                },
              },
            ]
          : [];
      }),
    };
  }

  public async applyCatalogUpdate(
    userId: string,
    tripId: string,
    confirmed: boolean,
  ) {
    if (!confirmed)
      throw expeditionsInvalid('Aktualizace snapshotů vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.trips.find(membership.householdId, tripId);
    const linked = await this.prisma.tripPackItem.findMany({
      where: { tripId, gearItemId: { not: null } },
      include: { gearItem: { include: { category: true } } },
    });
    await this.prisma.$transaction(
      linked.flatMap((item) =>
        item.gearItem
          ? [
              this.prisma.tripPackItem.update({
                where: { id: item.id },
                data: {
                  nameSnapshot: item.gearItem.name,
                  categoryNameSnapshot: item.gearItem.category?.name ?? null,
                  unitWeightGramsSnapshot: item.gearItem.weightGrams,
                },
              }),
            ]
          : [],
      ),
    );
    return this.trips.detail(userId, tripId);
  }

  private async resolveItems(
    householdId: string,
    participantIds: Set<string>,
    inputs: TripPackItemInputDto[],
  ) {
    const gearIds = [
      ...new Set(
        inputs.flatMap(({ gearItemId }) => (gearItemId ? [gearItemId] : [])),
      ),
    ];
    const gear = await this.prisma.gearItem.findMany({
      where: { householdId, id: { in: gearIds }, archivedAt: null },
      include: { category: true },
    });
    if (gear.length !== gearIds.length) throw expeditionsNotFound();
    const gearById = new Map(gear.map((item) => [item.id, item]));
    return inputs.map((input) => {
      if (input.assignedUserId && !participantIds.has(input.assignedUserId))
        throw expeditionsInvalid('Nosič položky musí být účastníkem výpravy.');
      if (!DECIMAL_QUANTITY_PATTERN.test(input.quantity))
        throw expeditionsInvalid('Množství položky není platné.');
      const quantity = new Prisma.Decimal(input.quantity);
      if (quantity.lte(0))
        throw expeditionsInvalid('Množství položky musí být kladné.');
      const source = input.gearItemId ? gearById.get(input.gearItemId) : null;
      return {
        id: input.id,
        data: {
          gearItemId: source?.id ?? null,
          nameSnapshot: input.name.trim(),
          categoryNameSnapshot: optionalText(input.categoryName),
          quantityDecimal: quantity,
          unitWeightGramsSnapshot: input.unitWeightGrams,
          loadType: input.loadType,
          criticality: input.criticality,
          isShared: input.isShared,
          assignedUserId: input.assignedUserId ?? null,
          packingStatus: input.packingStatus,
          packLocationLabel: optionalText(input.packLocationLabel),
          notes: optionalText(input.notes),
        },
      };
    });
  }

  private itemWeightGrams(item: {
    quantityDecimal: Prisma.Decimal;
    unitWeightGramsSnapshot: number;
  }) {
    return this.weights.itemWeight({
      id: 'preview',
      name: 'Položka',
      categoryNameSnapshot: null,
      assignedUserId: null,
      quantity: item.quantityDecimal.toString(),
      unitWeightGrams: item.unitWeightGramsSnapshot,
      loadType: 'CARRIED',
      packingStatus: 'PLANNED',
    });
  }
}
