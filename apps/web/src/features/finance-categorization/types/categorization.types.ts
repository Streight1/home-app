export interface CategorizationRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  field:
    | 'COUNTERPARTY_NAME'
    | 'COUNTERPARTY_ACCOUNT'
    | 'DESCRIPTION'
    | 'VARIABLE_SYMBOL';
  operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH';
  comparisonValue: string;
  categoryId: string;
  accountId: string | null;
  transactionType: string | null;
}
export type CategorizationRuleInput = Omit<
  CategorizationRule,
  'id' | 'accountId' | 'transactionType'
> & {
  accountId?: string | null;
  transactionType?: 'EXPENSE' | 'REFUND' | 'INCOME' | null;
};
