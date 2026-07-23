import type {
  BucketListItem,
  BucketListItemInput,
} from '../../types/bucket-list.types.js';

export interface BucketListItemFormValues {
  title: string;
  description: string;
  category: BucketListItemInput['category'];
  priority: BucketListItemInput['priority'];
  targetDate: string;
  locationPlaceId: string;
  locationLabel: string;
  locationNotes: string;
  notes: string;
  participantUserIds: string[];
  documentIds: string[];
}

export function initialBucketListItemValues(
  item: BucketListItem | undefined,
  currentUserId: string | undefined,
): BucketListItemFormValues {
  return item
    ? {
        title: item.title,
        description: item.description ?? '',
        category: item.category,
        priority: item.priority,
        targetDate: item.targetDate ?? '',
        locationPlaceId: item.location?.placeId ?? '',
        locationLabel: item.location?.label ?? '',
        locationNotes: item.location?.notes ?? '',
        notes: item.notes ?? '',
        participantUserIds: item.participants.map(({ id }) => id),
        documentIds: item.documents.map(({ id }) => id),
      }
    : {
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'NORMAL',
        targetDate: '',
        locationPlaceId: '',
        locationLabel: '',
        locationNotes: '',
        notes: '',
        participantUserIds: currentUserId ? [currentUserId] : [],
        documentIds: [],
      };
}

export function bucketListItemInput(
  values: BucketListItemFormValues,
): BucketListItemInput {
  return {
    title: values.title.trim(),
    category: values.category,
    priority: values.priority,
    participantUserIds: values.participantUserIds,
    documentIds: values.documentIds,
    ...(values.description.trim()
      ? { description: values.description.trim() }
      : {}),
    ...(values.targetDate ? { targetDate: values.targetDate } : {}),
    ...(values.locationPlaceId
      ? { locationPlaceId: values.locationPlaceId }
      : {}),
    ...(values.locationLabel.trim()
      ? { locationLabel: values.locationLabel.trim() }
      : {}),
    ...(values.locationNotes.trim()
      ? { locationNotes: values.locationNotes.trim() }
      : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}
