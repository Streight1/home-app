import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { documentNotFound } from '../domain/document.errors.js';
import {
  permanentDeleteTombstone,
  resolveTrashRestoreFolderId,
} from '../domain/document-lifecycle.js';
import type {
  CreateDocumentRecordInput,
  DocumentMetadataRecord,
  DocumentRecord,
  DocumentRepository,
  ListDocumentRecordsInput,
  SetDocumentStatusInput,
  UpdateDocumentRecordInput,
} from '../domain/document.repository.js';
import { documentInclude, toDocumentRecord } from './prisma-document.mapper.js';

function json(
  value: DocumentMetadataRecord | Record<string, string>,
): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public create(input: CreateDocumentRecordInput): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const document = await transaction.document.create({
        data: {
          id: input.id,
          householdId: input.householdId,
          folderId: input.folderId ?? null,
          title: input.title,
          description: input.description,
          notes: input.notes ?? null,
          type: input.type ?? 'GENERAL',
          metadataJson: json(input.metadataJson ?? {}),
          metadataSchemaVersion: input.metadataSchemaVersion ?? 1,
          documentDate: input.documentDate ?? null,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          file: {
            create: {
              id: input.file.id,
              storageKey: input.file.storageKey,
              originalFilename: input.file.originalFilename,
              sanitizedFilename:
                input.file.sanitizedFilename ?? input.file.originalFilename,
              extension:
                input.file.extension ??
                input.file.originalFilename.split('.').at(-1)?.toLowerCase() ??
                '',
              mimeType: input.file.mimeType,
              detectedMimeType:
                input.file.detectedMimeType ?? input.file.mimeType,
              sizeBytes: input.file.sizeBytes,
              checksumSha256: input.file.checksumSha256,
              version: input.file.version ?? 1,
              uploadedByUserId: input.userId,
            },
          },
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.id,
        metadata: {
          documentId: input.id,
          folderId: input.folderId ?? null,
          sizeBytes: input.file.sizeBytes,
          mimeType: input.file.mimeType,
        },
      });
      return toDocumentRecord(document);
    });
  }

  public async list(
    input: ListDocumentRecordsInput,
  ): Promise<{ items: DocumentRecord[]; totalItems: number }> {
    const where: Prisma.DocumentWhereInput = {
      householdId: input.householdId,
      status: input.status,
      ...(input.type ? { type: input.type } : {}),
      ...(input.rootFolderOnly ? { folderId: null } : {}),
      ...(input.folderIds ? { folderId: { in: [...input.folderIds] } } : {}),
      ...(input.createdFrom || input.createdTo
        ? {
            createdAt: {
              ...(input.createdFrom ? { gte: input.createdFrom } : {}),
              ...(input.createdTo ? { lte: input.createdTo } : {}),
            },
          }
        : {}),
      ...(input.query
        ? {
            OR: [
              { title: { contains: input.query, mode: 'insensitive' } },
              { description: { contains: input.query, mode: 'insensitive' } },
              { notes: { contains: input.query, mode: 'insensitive' } },
              {
                file: {
                  originalFilename: {
                    contains: input.query,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.DocumentOrderByWithRelationInput =
      input.sortBy === 'fileSize'
        ? { file: { sizeBytes: input.sortDirection } }
        : { [input.sortBy]: input.sortDirection };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: documentInclude,
      }),
      this.prisma.document.count({ where }),
    ]);
    return { items: items.map(toDocumentRecord), totalItems };
  }

  public async findById(
    householdId: string,
    documentId: string,
  ): Promise<DocumentRecord | null> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, householdId },
      include: documentInclude,
    });
    return document ? toDocumentRecord(document) : null;
  }

  public async findManyByIds(
    householdId: string,
    documentIds: readonly string[],
  ): Promise<DocumentRecord[]> {
    const documents = await this.prisma.document.findMany({
      where: { householdId, id: { in: [...documentIds] } },
      include: documentInclude,
    });
    return documents.map(toDocumentRecord);
  }

  public updateMetadata(
    input: UpdateDocumentRecordInput,
  ): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertExists(transaction, input.householdId, input.documentId);
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.metadataJson !== undefined
            ? {
                metadataJson: json(input.metadataJson),
                metadataOriginsJson: {},
              }
            : {}),
          ...(input.metadataSchemaVersion !== undefined
            ? { metadataSchemaVersion: input.metadataSchemaVersion }
            : {}),
          ...(input.documentDate !== undefined
            ? { documentDate: input.documentDate }
            : {}),
          updatedByUserId: input.userId,
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: {
          documentId: input.documentId,
          changedFields: [...input.changedFields],
        },
      });
      return toDocumentRecord(document);
    });
  }

  public move(input: {
    documentId: string;
    householdId: string;
    folderId: string | null;
    userId: string;
  }): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertExists(transaction, input.householdId, input.documentId);
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: { folderId: input.folderId, updatedByUserId: input.userId },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_MOVED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: { documentId: input.documentId, folderId: input.folderId },
      });
      return toDocumentRecord(document);
    });
  }

  public applyExtractedMetadata(input: {
    documentId: string;
    householdId: string;
    userId: string;
    jobId: string;
    values: DocumentMetadataRecord;
  }): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.document.findFirst({
        where: { id: input.documentId, householdId: input.householdId },
        select: { metadataJson: true, metadataOriginsJson: true },
      });
      if (!existing) throw documentNotFound();
      const current = (existing.metadataJson ?? {}) as DocumentMetadataRecord;
      const currentOrigins = (existing.metadataOriginsJson ?? {}) as Record<
        string,
        string
      >;
      const origins = {
        ...currentOrigins,
        ...Object.fromEntries(
          Object.keys(input.values).map((key) => [key, input.jobId]),
        ),
      };
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: {
          metadataJson: json({ ...current, ...input.values }),
          metadataOriginsJson: json(origins),
          updatedByUserId: input.userId,
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_EXTRACTION_CONFIRMED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: {
          documentId: input.documentId,
          changedFields: Object.keys(input.values),
        },
      });
      return toDocumentRecord(document);
    });
  }

  public setStatus(input: SetDocumentStatusInput): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertExists(transaction, input.householdId, input.documentId);
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: {
          status: input.status,
          archivedAt: input.archivedAt,
          updatedByUserId: input.userId,
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: input.action,
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: { documentId: input.documentId },
      });
      return toDocumentRecord(document);
    });
  }

  public moveToTrash(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.document.findFirst({
        where: { id: input.documentId, householdId: input.householdId },
        select: { folderId: true },
      });
      if (!existing) throw documentNotFound();
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: {
          status: 'TRASHED',
          trashedAt: new Date(),
          trashedByUserId: input.userId,
          trashedFromFolderId: existing.folderId,
          folderId: null,
          archivedAt: null,
          updatedByUserId: input.userId,
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_TRASHED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: { documentId: input.documentId },
      });
      return toDocumentRecord(document);
    });
  }

  public restoreFromTrash(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.document.findFirst({
        where: { id: input.documentId, householdId: input.householdId },
        select: { trashedFromFolderId: true },
      });
      if (!existing) throw documentNotFound();
      const originalFolder = existing.trashedFromFolderId
        ? await transaction.documentFolder.findFirst({
            where: {
              id: existing.trashedFromFolderId,
              householdId: input.householdId,
            },
            select: { id: true },
          })
        : null;
      const document = await transaction.document.update({
        where: { id: input.documentId },
        data: {
          status: 'ACTIVE',
          folderId: resolveTrashRestoreFolderId(
            existing.trashedFromFolderId,
            originalFolder !== null,
          ),
          trashedAt: null,
          trashedByUserId: null,
          trashedFromFolderId: null,
          updatedByUserId: input.userId,
        },
        include: documentInclude,
      });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_RESTORED_FROM_TRASH',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: { documentId: input.documentId },
      });
      return toDocumentRecord(document);
    });
  }

  public permanentlyDelete(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<{ taskId: string }> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.document.findFirst({
        where: {
          id: input.documentId,
          householdId: input.householdId,
          status: 'TRASHED',
        },
        select: {
          id: true,
          type: true,
          file: { select: { storageKey: true } },
        },
      });
      if (!existing?.file) throw documentNotFound();
      const taskId = randomUUID();
      await transaction.storedFileDeletionTask.create({
        data: { id: taskId, storageKey: existing.file.storageKey },
      });
      await transaction.extractionFieldCandidate.deleteMany({
        where: { result: { job: { documentId: input.documentId } } },
      });
      await transaction.extractionResult.deleteMany({
        where: { job: { documentId: input.documentId } },
      });
      await transaction.extractionJob.deleteMany({
        where: { documentId: input.documentId },
      });
      await transaction.documentFile.delete({
        where: { documentId: input.documentId },
      });
      await transaction.document.delete({ where: { id: input.documentId } });
      await this.audit.record(transaction, {
        action: 'DOCUMENT_PERMANENTLY_DELETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: permanentDeleteTombstone(input.documentId, existing.type),
      });
      return { taskId };
    });
  }

  public async findDeletionTasks(limit: number, taskId?: string) {
    return this.prisma.storedFileDeletionTask.findMany({
      where: {
        ...(taskId ? { id: taskId } : {}),
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, storageKey: true, status: true, attempts: true },
    });
  }

  public async markDeletionTaskProcessing(taskId: string): Promise<void> {
    await this.prisma.storedFileDeletionTask.update({
      where: { id: taskId },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
  }

  public async completeDeletionTask(taskId: string): Promise<void> {
    await this.prisma.storedFileDeletionTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        lastErrorCode: null,
      },
    });
  }

  public async failDeletionTask(
    taskId: string,
    errorCode: string,
  ): Promise<void> {
    await this.prisma.storedFileDeletionTask.update({
      where: { id: taskId },
      data: { status: 'FAILED', lastErrorCode: errorCode },
    });
  }

  public async recordFileAccess(
    householdId: string,
    userId: string,
    documentId: string,
    file: { mimeType: string; sizeBytes: number },
    action: 'DOCUMENT_PREVIEWED' | 'DOCUMENT_DOWNLOADED',
  ): Promise<void> {
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action,
        householdId,
        userId,
        entityType: 'Document',
        entityId: documentId,
        metadata: {
          documentId,
          sizeBytes: file.sizeBytes,
          mimeType: file.mimeType,
        },
      }),
    );
  }

  private async assertExists(
    transaction: Prisma.TransactionClient,
    householdId: string,
    documentId: string,
  ): Promise<void> {
    if (
      !(await transaction.document.findFirst({
        where: { id: documentId, householdId },
        select: { id: true },
      }))
    )
      throw documentNotFound();
  }
}
