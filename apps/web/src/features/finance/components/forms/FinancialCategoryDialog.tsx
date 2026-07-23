import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useFinancialCategories,
  useFinanceMutations,
} from '../../hooks/useFinance.js';
import type { FinancialCategory } from '../../types/finance.types.js';

export function FinancialCategoryDialog({
  open,
  category,
  onOpenChange,
}: {
  open: boolean;
  category?: FinancialCategory;
  onOpenChange: (open: boolean) => void;
}) {
  const categories = useFinancialCategories();
  const mutations = useFinanceMutations();
  const [name, setName] = useState(category?.name ?? '');
  const [kind, setKind] = useState(category?.kind ?? 'EXPENSE');
  const [parentId, setParentId] = useState(category?.parentId ?? '');
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      kind,
      parentId: parentId || null,
      colorToken: category?.colorToken ?? 'blue',
      iconKey: category?.iconKey ?? 'receipt',
      sortOrder: category?.sortOrder ?? 0,
    };
    if (category)
      mutations.updateCategory.mutate(
        { id: category.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    else
      mutations.createCategory.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Upravit kategorii' : 'Nová kategorie'}
      size="sm"
      mobileFullScreen
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Input
          label="Název"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Select
          label="Použití"
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as FinancialCategory['kind'])
          }
        >
          <option value="EXPENSE">Výdaje</option>
          <option value="INCOME">Příjmy</option>
          <option value="BOTH">Obojí</option>
        </Select>
        <Select
          label="Nadřazená kategorie"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">Bez nadřazené kategorie</option>
          {categories.data?.items
            .filter((item) => !item.parentId && item.id !== category?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </Select>
        <div className="flex justify-end gap-3">
          <Button onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button
            type="submit"
            variant="primary"
            loading={
              mutations.createCategory.isPending ||
              mutations.updateCategory.isPending
            }
          >
            {category ? 'Uložit změny' : 'Vytvořit kategorii'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
