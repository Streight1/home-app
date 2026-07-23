import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type { DocumentFolderRecord } from '../domain/folders/document-folder.js';
import type { DocumentFolderRepository } from '../domain/ports/document-folder.repository.js';

const folderSelect = {
  id: true,
  householdId: true,
  parentId: true,
  name: true,
  normalizedName: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DocumentFolderSelect;

@Injectable()
export class PrismaDocumentFolderRepository implements DocumentFolderRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(householdId: string): Promise<DocumentFolderRecord[]> {
    return this.prisma.documentFolder.findMany({
      where: { householdId },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
      select: folderSelect,
    });
  }

  public findById(
    householdId: string,
    folderId: string,
  ): Promise<DocumentFolderRecord | null> {
    return this.prisma.documentFolder.findFirst({
      where: { id: folderId, householdId },
      select: folderSelect,
    });
  }

  public findByNormalizedName(
    householdId: string,
    parentId: string | null,
    normalizedName: string,
  ): Promise<DocumentFolderRecord | null> {
    return this.prisma.documentFolder.findFirst({
      where: { householdId, parentId, normalizedName },
      select: folderSelect,
    });
  }

  public create(input: {
    id: string;
    householdId: string;
    parentId: string | null;
    name: string;
    normalizedName: string;
    userId: string;
  }): Promise<DocumentFolderRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const folder = await transaction.documentFolder.create({
        data: {
          id: input.id,
          householdId: input.householdId,
          parentId: input.parentId,
          name: input.name,
          normalizedName: input.normalizedName,
          createdByUserId: input.userId,
        },
        select: folderSelect,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_FOLDER_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'DocumentFolder',
        entityId: input.id,
        metadata: { folderId: input.id },
      });
      return folder;
    });
  }

  public update(input: {
    folderId: string;
    householdId: string;
    parentId?: string | null;
    name?: string;
    normalizedName?: string;
    userId: string;
    action: 'DOCUMENT_FOLDER_RENAMED' | 'DOCUMENT_FOLDER_MOVED';
  }): Promise<DocumentFolderRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const folder = await transaction.documentFolder.update({
        where: { id: input.folderId, householdId: input.householdId },
        data: {
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.normalizedName !== undefined
            ? { normalizedName: input.normalizedName }
            : {}),
        },
        select: folderSelect,
      });
      await this.audit.record(transaction, {
        action: input.action,
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'DocumentFolder',
        entityId: input.folderId,
        metadata: { folderId: input.folderId },
      });
      return folder;
    });
  }

  public async countContents(
    householdId: string,
    folderId: string,
  ): Promise<{ children: number; documents: number }> {
    const [children, documents] = await this.prisma.$transaction([
      this.prisma.documentFolder.count({
        where: { householdId, parentId: folderId },
      }),
      this.prisma.document.count({ where: { householdId, folderId } }),
    ]);
    return { children, documents };
  }

  public delete(
    householdId: string,
    folderId: string,
    userId: string,
  ): Promise<void> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.documentFolder.delete({
        where: { id: folderId, householdId },
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_FOLDER_DELETED',
        householdId,
        userId,
        entityType: 'DocumentFolder',
        entityId: folderId,
        metadata: { folderId },
      });
    });
  }
}
