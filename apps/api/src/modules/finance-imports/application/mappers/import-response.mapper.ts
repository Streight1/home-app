import type { Prisma } from '../../../../generated/prisma/client.js';

const publicSessionSelect = {
  id: true,
  accountId: true,
  profileId: true,
  sourceKind: true,
  status: true,
  originalFilename: true,
  fileSizeBytes: true,
  detectedEncoding: true,
  detectedDelimiter: true,
  detectedHeaderRow: true,
  totalRowCount: true,
  validRowCount: true,
  invalidRowCount: true,
  duplicateRowCount: true,
  ignoredRowCount: true,
  importedRowCount: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
  committedAt: true,
  cancelledAt: true,
  account: { select: { id: true, name: true, type: true, currencyCode: true } },
  profile: { select: { id: true, name: true } },
} satisfies Prisma.FinanceImportSessionSelect;

export type ImportSessionForResponse = Prisma.FinanceImportSessionGetPayload<{
  select: typeof publicSessionSelect;
}>;

export const importSessionPublicSelect = publicSessionSelect;

export function mapImportSession(session: ImportSessionForResponse) {
  return {
    ...session,
    fileSizeBytes: session.fileSizeBytes.toString(),
  };
}
