import { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button.js';
import { Select } from '../../../components/ui/Select/Select.js';
import { useFinancialCategories } from '../../finance/hooks/useFinance.js';
import { useCategorizationMutations } from '../hooks/useFinanceCategorization.js';

export function BulkCategorizeTransactions({
  transactionIds,
  onCompleted,
}: {
  transactionIds: string[];
  onCompleted: () => void;
}) {
  const categories = useFinancialCategories();
  const mutations = useCategorizationMutations();
  const [categoryId, setCategoryId] = useState('');
  if (transactionIds.length === 0) return null;
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface-subtle p-3 sm:grid-cols-[auto_minmax(12rem,1fr)_auto] sm:items-end">
      <p className="pb-3 text-body-sm font-medium tabular-nums">
        Vybráno: {transactionIds.length}
      </p>
      <Select
        label="Nová kategorie"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        <option value="">Vyberte kategorii</option>
        {categories.data?.items
          .filter(
            (category) => !category.archivedAt && category.kind !== 'INCOME',
          )
          .map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
      </Select>
      <Button
        variant="primary"
        disabled={!categoryId}
        loading={mutations.bulk.isPending}
        onClick={() =>
          mutations.bulk.mutate(
            { transactionIds, categoryId },
            { onSuccess: onCompleted },
          )
        }
      >
        Zařadit vybrané
      </Button>
    </div>
  );
}
