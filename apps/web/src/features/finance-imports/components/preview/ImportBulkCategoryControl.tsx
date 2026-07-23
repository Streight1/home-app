import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Select } from '../../../../components/ui/Select/Select.js';

export interface ImportCategoryOption {
  id: string;
  name: string;
}

export function ImportBulkCategoryControl({
  categories,
  rowIds,
  loading,
  onApply,
}: {
  categories: ImportCategoryOption[];
  rowIds: string[];
  loading: boolean;
  onApply: (categoryId: string) => void;
}) {
  const [categoryId, setCategoryId] = useState('');
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface-subtle p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <Select
        label="Kategorie pro zobrazené řádky"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        <option value="">Vyberte kategorii</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        loading={loading}
        disabled={!categoryId || rowIds.length === 0}
        onClick={() => onApply(categoryId)}
      >
        Použít pro zobrazené
      </Button>
    </div>
  );
}
