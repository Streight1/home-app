import { dateOnlyString } from '../../finance/domain/finance.types.js';
import type { PrismaInsightRepository } from '../infrastructure/prisma-insight.repository.js';

export function mapInsight(
  insight: Awaited<ReturnType<PrismaInsightRepository['list']>>[number],
) {
  const evidence = isRecord(insight.evidenceJson) ? insight.evidenceJson : {};
  const categoryId =
    typeof evidence.categoryId === 'string'
      ? evidence.categoryId
      : evidence.kind === 'category' && typeof evidence.key === 'string'
        ? evidence.key
        : null;
  const merchantQuery =
    evidence.kind === 'merchant' && typeof evidence.label === 'string'
      ? evidence.label
      : null;
  return {
    id: insight.id,
    type: insight.type,
    currencyCode: insight.currencyCode,
    periodStart: dateOnlyString(insight.periodStart),
    periodEnd: dateOnlyString(insight.periodEnd),
    severity: insight.severity,
    status: insight.status,
    title: insight.title,
    explanation: insight.explanation,
    evidence: insight.evidenceJson,
    presentation: {
      primaryValueMinor:
        stringValue(evidence.currentMinor) ??
        stringValue(evidence.totalMinor) ??
        stringValue(evidence.amountMinor),
      baselineMinor: stringValue(evidence.baselineMinor),
      count: typeof evidence.count === 'number' ? evidence.count : null,
      comparisonPeriods:
        typeof evidence.comparisonPeriods === 'number'
          ? evidence.comparisonPeriods
          : null,
    },
    transactionFilter: categoryId
      ? { categoryId }
      : merchantQuery
        ? { query: merchantQuery }
        : null,
    firstDetectedAt: insight.firstDetectedAt.toISOString(),
    lastDetectedAt: insight.lastDetectedAt.toISOString(),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const stringValue = (value: unknown) =>
  typeof value === 'string' ? value : null;
