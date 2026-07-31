export type GearLoadType = 'CARRIED' | 'WORN' | 'CONSUMABLE';
export type GearCriticality = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
export type GearWeightStatus = 'VERIFIED' | 'ESTIMATED' | 'UNKNOWN';
export type PackingStatus = 'PLANNED' | 'PACKED' | 'MISSING' | 'EXCLUDED';
export type TripType =
  | 'DAY_HIKE'
  | 'OVERNIGHT'
  | 'MULTI_DAY_TREK'
  | 'HUT_TO_HUT'
  | 'CAMPING'
  | 'OTHER';
export type TripStatus =
  | 'PLANNING'
  | 'PACKING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ARCHIVED';
export type ReviewOutcome =
  | 'USED'
  | 'UNUSED'
  | 'MISSING_DURING_TRIP'
  | 'BROKEN'
  | 'NOT_REVIEWED';

export interface GearCategory {
  id: string;
  name: string;
  iconKey: string;
  colorToken: string;
  sortOrder: number;
}

export interface GearItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  notes: string | null;
  weightGrams: number;
  weightStatus: GearWeightStatus;
  defaultLoadType: GearLoadType;
  defaultCriticality: GearCriticality;
  isHouseholdShared: boolean;
  defaultQuantity: string;
  purchaseUrl: string | null;
  productUrl: string | null;
  imageSourceUrl: string | null;
  imageAttribution: string | null;
  archivedAt: string | null;
  category: GearCategory | null;
  owner: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  coverDocumentId: string | null;
  updatedAt: string;
}

export interface GearInput {
  name: string;
  categoryId?: string | null;
  brand?: string;
  model?: string;
  description?: string;
  notes?: string;
  weightGrams: number;
  weightStatus: GearWeightStatus;
  defaultLoadType: GearLoadType;
  defaultCriticality: GearCriticality;
  ownerUserId?: string | null;
  isHouseholdShared: boolean;
  defaultQuantity: string;
  purchaseUrl?: string;
  productUrl?: string;
  documents: {
    documentId: string;
    relationType: 'PHOTO' | 'MANUAL' | 'RECEIPT' | 'OTHER';
    isCover: boolean;
  }[];
}

export interface PackItem {
  id: string;
  gearItemId: string | null;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  quantity: string;
  unitWeightGrams: number;
  loadType: GearLoadType;
  criticality: GearCriticality;
  isShared: boolean;
  defaultAssignedUserId: string | null;
  packLocationLabel: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface PackTemplate {
  id: string;
  name: string;
  description: string | null;
  tripType: TripType;
  seasonLabel: string | null;
  targetBaseWeightGrams: number | null;
  defaultParticipantCount: number;
  archivedAt: string | null;
  updatedAt: string;
  items: PackItem[];
}

export interface TripParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'ORGANIZER' | 'PARTICIPANT';
}

export interface TripPackItem {
  id: string;
  sourceTemplateItemId: string | null;
  gearItemId: string | null;
  name: string;
  categoryName: string | null;
  quantity: string;
  unitWeightGrams: number;
  loadType: GearLoadType;
  criticality: GearCriticality;
  isShared: boolean;
  assignedUserId: string | null;
  packingStatus: PackingStatus;
  packLocationLabel: string | null;
  notes: string | null;
  packedAt: string | null;
  packedByUserId: string | null;
  reviewOutcome: ReviewOutcome;
  reviewNotes: string | null;
  sortOrder: number;
}

export interface TripPackItemInput {
  id?: string;
  gearItemId?: string | null;
  name: string;
  categoryName?: string;
  quantity: string;
  unitWeightGrams: number;
  loadType: GearLoadType;
  criticality: GearCriticality;
  isShared: boolean;
  assignedUserId?: string | null;
  packingStatus: PackingStatus;
  packLocationLabel?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  tripType: TripType;
  status: TripStatus;
  startsOn: string;
  endsOn: string;
  locationLabel: string | null;
  overnightCount: number;
  targetBaseWeightGrams: number | null;
  notes: string | null;
  createdFromTemplateId: string | null;
  archivedAt: string | null;
  updatedAt: string;
  participants: TripParticipant[];
  items: TripPackItem[];
  acknowledgedRuleCodes: string[];
}

export interface TripInput {
  title: string;
  description?: string;
  tripType: TripType;
  startsOn: string;
  endsOn: string;
  locationLabel?: string;
  overnightCount: number;
  targetBaseWeightGrams?: number | null;
  notes?: string;
  templateId?: string | null;
  participants: {
    userId: string;
    role: 'ORGANIZER' | 'PARTICIPANT';
  }[];
}

export interface TripWeightSummary {
  baseWeightGrams: number;
  wornWeightGrams: number;
  consumableWeightGrams: number;
  startingPackWeightGrams: number;
  systemWeightGrams: number;
  packedWeightGrams: number;
  totalPlannedWeightGrams: number;
  targetBaseWeightGrams: number | null;
  baseWeightDifferenceGrams: number | null;
  categories: { key: string; systemWeightGrams: number }[];
  participantWeights: {
    key: string;
    displayName: string;
    systemWeightGrams: number;
  }[];
  participants: { id: string; displayName: string | null }[];
  heaviest: { id: string; name: string; weightGrams: number }[];
  readiness: {
    ready: boolean;
    packedCount: number;
    totalCount: number;
    unpackedRequiredCount: number;
    missingRequiredCount: number;
    unassignedSharedRequiredCount: number;
    blockingItems: { id: string; name: string }[];
    advisoryRules: {
      code: string;
      reason: string;
      acknowledged: boolean;
    }[];
    disclaimer: string;
  };
}

export interface ExpeditionsDashboard {
  nextTrip: null | {
    id: string;
    title: string;
    startsOn: string;
    status: TripStatus;
    packedCount: number;
    totalCount: number;
    missingRequiredCount: number;
    baseWeightGrams: number;
    targetBaseWeightGrams: number | null;
  };
  navigationTarget:
    | { area: 'expeditions'; screen: 'overview' }
    | { area: 'expeditions'; screen: 'trip'; tripId: string };
}

export interface TripTemplateReviewPreview {
  available: boolean;
  templateId: string | null;
  templateName: string | null;
  remove: {
    tripItemId: string;
    templateItemId: string;
    name: string;
    weightGrams: number;
  }[];
  add: {
    tripItemId: string;
    name: string;
    weightGrams: number;
  }[];
}
