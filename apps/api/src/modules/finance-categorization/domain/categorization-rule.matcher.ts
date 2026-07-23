import { normalizeRuleValue } from './merchant-normalizer.js';

export interface CategorizationCandidate {
  accountId: string;
  transactionType: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
  variableSymbol: string | null;
}

export interface CategorizationRuleMatch {
  categoryId: string;
  accountId: string | null;
  transactionType: string | null;
  field:
    | 'COUNTERPARTY_NAME'
    | 'COUNTERPARTY_ACCOUNT'
    | 'DESCRIPTION'
    | 'VARIABLE_SYMBOL';
  operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH';
  normalizedComparisonValue: string;
}

const candidateValue = (
  candidate: CategorizationCandidate,
  field: CategorizationRuleMatch['field'],
): string => {
  const value = {
    COUNTERPARTY_NAME: candidate.counterpartyName,
    COUNTERPARTY_ACCOUNT: candidate.counterpartyAccount,
    DESCRIPTION: candidate.description,
    VARIABLE_SYMBOL: candidate.variableSymbol,
  }[field];
  return normalizeRuleValue(value ?? '');
};

export function matchCategorizationRule(
  candidate: CategorizationCandidate,
  rules: readonly CategorizationRuleMatch[],
): string | null {
  for (const rule of rules) {
    if (rule.accountId && rule.accountId !== candidate.accountId) continue;
    if (
      rule.transactionType &&
      rule.transactionType !== candidate.transactionType
    )
      continue;
    const value = candidateValue(candidate, rule.field);
    const matches =
      rule.operator === 'EQUALS'
        ? value === rule.normalizedComparisonValue
        : rule.operator === 'CONTAINS'
          ? value.includes(rule.normalizedComparisonValue)
          : value.startsWith(rule.normalizedComparisonValue);
    if (matches) return rule.categoryId;
  }
  return null;
}
