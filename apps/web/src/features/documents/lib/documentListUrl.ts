import type {
  DocumentListQuery,
  DocumentPageSize,
  DocumentSortField,
  DocumentStatus,
  DocumentTypeKey,
} from '../types/document.types.js';
const pageSizes = new Set([10, 20, 50, 100]);
const sortFields = new Set([
  'createdAt',
  'updatedAt',
  'title',
  'documentDate',
  'fileSize',
]);
export function documentListQueryFromUrl(
  parameters: URLSearchParams,
): Required<
  Pick<
    DocumentListQuery,
    'page' | 'pageSize' | 'status' | 'sortBy' | 'sortDirection'
  >
> &
  DocumentListQuery {
  const page = Math.max(1, Number(parameters.get('page')) || 1);
  const rawPageSize = Number(parameters.get('pageSize'));
  const pageSize = (
    pageSizes.has(rawPageSize) ? rawPageSize : 20
  ) as DocumentPageSize;
  const status =
    parameters.get('status') === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
  const rawSort = parameters.get('sortBy') ?? '';
  const query = parameters.get('query');
  const folderId = parameters.get('folderId');
  const type = parameters.get('type');
  return {
    page,
    pageSize,
    status: status as DocumentStatus,
    sortBy: (sortFields.has(rawSort)
      ? rawSort
      : 'createdAt') as DocumentSortField,
    sortDirection: parameters.get('sortDirection') === 'asc' ? 'asc' : 'desc',
    ...(query ? { query } : {}),
    ...(folderId ? { folderId } : {}),
    ...(type ? { type: type as DocumentTypeKey } : {}),
    ...(parameters.get('includeSubfolders') === 'true'
      ? { includeSubfolders: true }
      : {}),
  };
}
export function documentListUrl(query: DocumentListQuery): URLSearchParams {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== '' && value !== false)
      parameters.set(key, String(value));
  return parameters;
}
