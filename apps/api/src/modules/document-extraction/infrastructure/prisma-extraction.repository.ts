import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { DocumentTypeKey } from '../../documents/domain/metadata/document-type.js';
import type {
  ExtractionCandidateRecord,
  ExtractionJobRecord,
  ExtractionRepository,
} from '../domain/extraction.repository.js';
import type {
  ConfidenceReason,
  ExtractedLineItem,
  ExtractedFieldCandidate,
  ExtractedValue,
  ExtractionFieldStatus,
  SourceRegion,
} from '../domain/extraction.types.js';

const jobInclude = {
  document: { select: { type: true } },
  result: {
    include: { candidates: { orderBy: { fieldKey: 'asc' as const } } },
  },
} satisfies Prisma.ExtractionJobInclude;
type PrismaJob = Prisma.ExtractionJobGetPayload<{ include: typeof jobInclude }>;

function extractedValue(value: Prisma.JsonValue): ExtractedValue {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? value
    : Array.isArray(value)
      ? (value.filter(
          (item): item is Prisma.JsonObject =>
            typeof item === 'object' && item !== null && !Array.isArray(item),
        ) as unknown as ExtractedLineItem[])
      : '';
}
function confidenceReasons(value: Prisma.JsonValue): ConfidenceReason[] {
  return Array.isArray(value)
    ? value.filter((item): item is ConfidenceReason => typeof item === 'string')
    : [];
}
function sourceRegion(value: Prisma.JsonValue | null): SourceRegion | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  const source = value;
  return typeof source.page === 'number' &&
    typeof source.x === 'number' &&
    typeof source.y === 'number' &&
    typeof source.width === 'number' &&
    typeof source.height === 'number'
    ? {
        page: source.page,
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height,
      }
    : null;
}
function jsonValue(value: ExtractedValue): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
function mapCandidate(
  candidate: NonNullable<PrismaJob['result']>['candidates'][number],
): ExtractionCandidateRecord {
  return {
    id: candidate.id,
    fieldKey: candidate.fieldKey,
    rawValue: candidate.rawValue,
    normalizedValue: extractedValue(candidate.normalizedValueJson),
    confidence: Number(candidate.confidence),
    confidenceReasons: confidenceReasons(candidate.confidenceReasonsJson),
    sourcePage: candidate.sourcePage,
    sourceText: candidate.sourceText,
    sourceRegion: sourceRegion(candidate.sourceRegionJson),
    status: candidate.status,
    reviewedAt: candidate.reviewedAt,
  };
}
function mapJob(job: PrismaJob): ExtractionJobRecord {
  return {
    id: job.id,
    householdId: job.householdId,
    documentId: job.documentId,
    documentFileId: job.documentFileId,
    documentType: job.document.type,
    status: job.status,
    extractorKey: job.extractorKey,
    extractorVersion: job.extractorVersion,
    schemaVersion: job.schemaVersion,
    errorCode: job.errorCode,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    createdAt: job.createdAt,
    rawText: job.result?.rawText ?? null,
    candidates: job.result?.candidates.map(mapCandidate) ?? [],
  };
}

@Injectable()
export class PrismaExtractionRepository implements ExtractionRepository {
  public constructor(private readonly prisma: PrismaService) {}
  public async createJob(input: {
    id: string;
    householdId: string;
    documentId: string;
    documentFileId: string;
    documentType: DocumentTypeKey;
    extractorKey: string;
    extractorVersion: string;
    schemaVersion: number;
    userId: string;
  }): Promise<ExtractionJobRecord> {
    const job = await this.prisma.extractionJob.create({
      data: {
        id: input.id,
        householdId: input.householdId,
        documentId: input.documentId,
        documentFileId: input.documentFileId,
        extractorKey: input.extractorKey,
        extractorVersion: input.extractorVersion,
        schemaVersion: input.schemaVersion,
        requestedByUserId: input.userId,
      },
      include: jobInclude,
    });
    return mapJob(job);
  }
  public async findJob(
    householdId: string,
    documentId: string,
    jobId: string,
  ): Promise<ExtractionJobRecord | null> {
    const job = await this.prisma.extractionJob.findFirst({
      where: { id: jobId, householdId, documentId },
      include: jobInclude,
    });
    return job ? mapJob(job) : null;
  }
  public async markProcessing(jobId: string): Promise<void> {
    await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), errorCode: null },
    });
  }
  public async complete(
    jobId: string,
    rawText: string,
    candidates: readonly ExtractedFieldCandidate[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.extractionResult.create({
        data: {
          jobId,
          rawText,
          structuredDataJson: Object.fromEntries(
            candidates.map((candidate) => [
              candidate.fieldKey,
              candidate.normalizedValue,
            ]),
          ) as Prisma.InputJsonObject,
          candidates: {
            create: candidates.map((candidate) => ({
              fieldKey: candidate.fieldKey,
              rawValue: candidate.rawValue,
              normalizedValueJson: jsonValue(candidate.normalizedValue),
              confidence: Math.min(1, Math.max(0, candidate.confidence)),
              confidenceReasonsJson: [...candidate.confidenceReasons],
              sourcePage: candidate.sourcePage,
              sourceText: candidate.sourceText,
              ...(candidate.sourceRegion
                ? {
                    sourceRegionJson:
                      candidate.sourceRegion as unknown as Prisma.InputJsonObject,
                  }
                : {}),
            })),
          },
        },
      });
      await transaction.extractionJob.update({
        where: { id: jobId },
        data: {
          status: candidates.length > 0 ? 'REVIEW_REQUIRED' : 'COMPLETED',
          finishedAt: new Date(),
        },
      });
    });
  }
  public async fail(jobId: string, errorCode: string): Promise<void> {
    await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorCode, finishedAt: new Date() },
    });
  }
  public async reviewCandidate(input: {
    jobId: string;
    candidateId: string;
    userId: string;
    status: Exclude<ExtractionFieldStatus, 'PROPOSED'>;
    normalizedValue: ExtractedValue;
  }): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.extractionFieldCandidate.update({
        where: { id: input.candidateId, result: { jobId: input.jobId } },
        data: {
          status: input.status,
          normalizedValueJson: jsonValue(input.normalizedValue),
          reviewedByUserId: input.userId,
          reviewedAt: new Date(),
        },
      });
      const proposed = await transaction.extractionFieldCandidate.count({
        where: { result: { jobId: input.jobId }, status: 'PROPOSED' },
      });
      if (proposed === 0)
        await transaction.extractionJob.update({
          where: { id: input.jobId },
          data: { status: 'COMPLETED' },
        });
    });
  }
}
