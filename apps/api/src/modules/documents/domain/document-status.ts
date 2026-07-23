export const documentStatuses = ['ACTIVE', 'ARCHIVED', 'TRASHED'] as const;

export type DocumentStatus = (typeof documentStatuses)[number];

export const documentSortFields = [
  'createdAt',
  'updatedAt',
  'title',
  'documentDate',
  'fileSize',
] as const;
export type DocumentSortField = (typeof documentSortFields)[number];

export const sortDirections = ['asc', 'desc'] as const;
export type SortDirection = (typeof sortDirections)[number];
