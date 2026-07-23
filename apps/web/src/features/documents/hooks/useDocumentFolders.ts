import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDocumentFolder,
  deleteDocumentFolder,
  getDocumentFolders,
  moveDocumentFolder,
  renameDocumentFolder,
} from '../api/documentFoldersApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export const DOCUMENT_FOLDERS_QUERY_KEY = ['document-folders'] as const;
export function useDocumentFolders() {
  return useQuery({
    queryKey: DOCUMENT_FOLDERS_QUERY_KEY,
    queryFn: getDocumentFolders,
  });
}
function useFolderMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: DOCUMENT_FOLDERS_QUERY_KEY }),
        client.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY }),
      ]);
    },
  });
}
export function useCreateFolder() {
  return useFolderMutation((input: { name: string; parentId: string | null }) =>
    createDocumentFolder(input.name, input.parentId),
  );
}
export function useRenameFolder() {
  return useFolderMutation((input: { folderId: string; name: string }) =>
    renameDocumentFolder(input.folderId, input.name),
  );
}
export function useMoveFolder() {
  return useFolderMutation(
    (input: { folderId: string; parentId: string | null }) =>
      moveDocumentFolder(input.folderId, input.parentId),
  );
}
export function useDeleteFolder() {
  return useFolderMutation((folderId: string) =>
    deleteDocumentFolder(folderId),
  );
}
