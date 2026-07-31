import type { Prisma } from '../../../generated/prisma/client.js';
import { serializeDecimal } from '../../../common/numbers/decimal.js';
import { dateOnlyString } from '../domain/expeditions.types.js';

export const gearListInclude = {
  category: true,
  owner: { select: { id: true, displayName: true, avatarUrl: true } },
  documents: {
    where: { isCover: true },
    select: { documentId: true },
    take: 1,
  },
} satisfies Prisma.GearItemInclude;

export type GearRecord = Prisma.GearItemGetPayload<{
  include: typeof gearListInclude;
}>;

export const packTemplateInclude = {
  items: {
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.PackTemplateInclude;

export type PackTemplateRecord = Prisma.PackTemplateGetPayload<{
  include: typeof packTemplateInclude;
}>;

export const tripInclude = {
  participants: {
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  packItems: {
    orderBy: { sortOrder: 'asc' as const },
  },
  readinessAcknowledgements: {
    select: { ruleCode: true },
  },
} satisfies Prisma.TripInclude;

export type TripRecord = Prisma.TripGetPayload<{
  include: typeof tripInclude;
}>;

export function mapGear(record: GearRecord) {
  return {
    id: record.id,
    name: record.name,
    brand: record.brand,
    model: record.model,
    description: record.description,
    notes: record.notes,
    weightGrams: record.weightGrams,
    weightStatus: record.weightStatus,
    defaultLoadType: record.defaultLoadType,
    defaultCriticality: record.defaultCriticality,
    isHouseholdShared: record.isHouseholdShared,
    defaultQuantity: serializeDecimal(record.defaultQuantityDecimal),
    purchaseUrl: record.purchaseUrl,
    productUrl: record.productUrl,
    imageSourceUrl: record.imageSourceUrl,
    imageAttribution: record.imageAttribution,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    category: record.category
      ? {
          id: record.category.id,
          name: record.category.name,
          iconKey: record.category.iconKey,
          colorToken: record.category.colorToken,
        }
      : null,
    owner: record.owner,
    coverDocumentId: record.documents[0]?.documentId ?? null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapTemplate(record: PackTemplateRecord) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    tripType: record.tripType,
    seasonLabel: record.seasonLabel,
    targetBaseWeightGrams: record.targetBaseWeightGrams,
    defaultParticipantCount: record.defaultParticipantCount,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    items: record.items.map((item) => ({
      id: item.id,
      gearItemId: item.gearItemId,
      name: item.nameSnapshot,
      categoryId: item.categoryId,
      categoryName: item.categoryNameSnapshot,
      quantity: serializeDecimal(item.quantityDecimal),
      unitWeightGrams: item.unitWeightGramsSnapshot,
      loadType: item.loadType,
      criticality: item.criticality,
      isShared: item.isShared,
      defaultAssignedUserId: item.defaultAssignedUserId,
      packLocationLabel: item.packLocationLabel,
      notes: item.notes,
      sortOrder: item.sortOrder,
    })),
  };
}

export function mapTrip(record: TripRecord) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    tripType: record.tripType,
    status: record.status,
    startsOn: dateOnlyString(record.startsOn),
    endsOn: dateOnlyString(record.endsOn),
    locationLabel: record.locationLabel,
    overnightCount: record.overnightCount,
    targetBaseWeightGrams: record.targetBaseWeightGrams,
    notes: record.notes,
    createdFromTemplateId: record.createdFromTemplateId,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    participants: record.participants.map(({ user, role }) => ({
      ...user,
      role,
    })),
    items: record.packItems.map((item) => ({
      id: item.id,
      sourceTemplateItemId: item.sourceTemplateItemId,
      gearItemId: item.gearItemId,
      name: item.nameSnapshot,
      categoryName: item.categoryNameSnapshot,
      quantity: serializeDecimal(item.quantityDecimal),
      unitWeightGrams: item.unitWeightGramsSnapshot,
      loadType: item.loadType,
      criticality: item.criticality,
      isShared: item.isShared,
      assignedUserId: item.assignedUserId,
      packingStatus: item.packingStatus,
      packLocationLabel: item.packLocationLabel,
      notes: item.notes,
      packedAt: item.packedAt?.toISOString() ?? null,
      packedByUserId: item.packedByUserId,
      reviewOutcome: item.reviewOutcome,
      reviewNotes: item.reviewNotes,
      sortOrder: item.sortOrder,
    })),
    acknowledgedRuleCodes: record.readinessAcknowledgements.map(
      ({ ruleCode }) => ruleCode,
    ),
  };
}
