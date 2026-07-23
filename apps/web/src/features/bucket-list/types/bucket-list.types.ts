export type BucketListStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type BucketListItemStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type BucketListPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type BucketListCategory =
  | 'TRAVEL'
  | 'EXPERIENCE'
  | 'SPORT'
  | 'RELATIONSHIP'
  | 'CULTURE'
  | 'LEARNING'
  | 'HOME'
  | 'FOOD'
  | 'NATURE'
  | 'PERSONAL'
  | 'OTHER';

export interface BucketListProgress {
  planned: number;
  completed: number;
  skipped: number;
  total: number;
  percent: number;
}

export interface BucketList {
  id: string;
  year: number;
  title: string;
  description: string | null;
  status: BucketListStatus;
  progress: BucketListProgress;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canEdit: boolean;
    canClose: boolean;
    canArchive: boolean;
  };
}

export interface BucketListParticipant {
  id: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  calendarColorToken: string;
}

export interface BucketListItem {
  id: string;
  bucketListId: string;
  title: string;
  description: string | null;
  category: BucketListCategory;
  priority: BucketListPriority;
  status: BucketListItemStatus;
  targetDate: string | null;
  location: {
    placeId: string | null;
    label: string | null;
    notes: string | null;
    routable: boolean;
  } | null;
  notes: string | null;
  sortOrder: number;
  participants: BucketListParticipant[];
  documents: {
    id: string;
    type: string;
    primaryLabel: string;
    canPreview: boolean;
  }[];
  completion: {
    completedAt: string;
    completedByUserId: string | null;
  } | null;
  skipped: {
    skippedAt: string;
    skippedByUserId: string | null;
    reason: string | null;
  } | null;
  completions: {
    id: string;
    completedAt: string;
    note: string | null;
    completedBy: {
      id: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }[];
  rollover: {
    carriedFrom: { id: string; title: string } | null;
    carriedTo: { id: string; title: string } | null;
  };
  permissions: {
    canEdit: boolean;
    canComplete: boolean;
    canReopen: boolean;
    canSkip: boolean;
    canRestore: boolean;
    canDelete: boolean;
  };
}

export interface BucketListItemInput {
  title: string;
  description?: string;
  category: BucketListCategory;
  priority: BucketListPriority;
  targetDate?: string;
  locationPlaceId?: string;
  locationLabel?: string;
  locationNotes?: string;
  notes?: string;
  sortOrder?: number;
  participantUserIds: string[];
  documentIds: string[];
}

export interface BucketListDashboard {
  year: number;
  list: { id: string; title: string; status: BucketListStatus } | null;
  progress: BucketListProgress;
  items: {
    id: string;
    title: string;
    status: BucketListItemStatus;
    category: BucketListCategory;
    priority: BucketListPriority;
    targetDate: string | null;
    participants: {
      id: string;
      displayName: string | null;
      avatarUrl: string | null;
    }[];
    permissions: { canComplete: boolean };
    navigationTarget: {
      area: 'bucket-list';
      screen: 'item';
      itemId: string;
    };
  }[];
}

export interface BucketListFilters {
  status?: BucketListItemStatus;
  category?: BucketListCategory;
  participantUserId?: string;
  query?: string;
  sortBy?: 'sortOrder' | 'targetDate' | 'title' | 'createdAt' | 'completedAt';
  sortDirection?: 'asc' | 'desc';
}
