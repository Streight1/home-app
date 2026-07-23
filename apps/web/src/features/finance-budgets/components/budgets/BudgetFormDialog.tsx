import { useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { useFinancialCategories } from '../../../finance/hooks/useFinance.js';
import { parseMoneyInputToMinorUnits } from '../../../finance/finance.public.js';
import { useFinanceBudgetMutations } from '../../hooks/useFinanceBudgets.js';
import type { BudgetInput } from '../../types/finance-budget.types.js';
import { BudgetCategoryLimitField } from './BudgetCategoryLimitField.js';

const currentMonth = () => {
  const now = new Date();
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const monthRange = (month: string) => {
  const [year = 1970, value = 1] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(end).padStart(2, '0')}`,
  };
};

export function BudgetFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const categories = useFinancialCategories();
  const mutation = useFinanceBudgetMutations().create;
  const [name, setName] = useState('Měsíční rozpočet');
  const [currencyCode, setCurrency] = useState<'CZK' | 'EUR'>('CZK');
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'CUSTOM'>('MONTHLY');
  const [month, setMonth] = useState(currentMonth);
  const initialRange = monthRange(month);
  const [periodStart, setPeriodStart] = useState(initialRange.start);
  const [periodEnd, setPeriodEnd] = useState(initialRange.end);
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const expenseCategories = useMemo(
    () =>
      (categories.data?.items ?? []).filter(
        (category) => !category.archivedAt && category.kind !== 'INCOME',
      ),
    [categories.data],
  );
  const allocationTotal = Object.values(limits).reduce((sum, value) => {
    if (!value.trim()) return sum;
    try {
      return sum + BigInt(parseMoneyInputToMinorUnits(value));
    } catch {
      return sum;
    }
  }, 0n);
  let parsedTotal: bigint | null = null;
  try {
    parsedTotal = total.trim()
      ? BigInt(parseMoneyInputToMinorUnits(total))
      : null;
  } catch {
    parsedTotal = null;
  }

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const range =
        periodType === 'MONTHLY'
          ? monthRange(month)
          : { start: periodStart, end: periodEnd };
      const input: BudgetInput = {
        name,
        currencyCode,
        periodType,
        periodStart: range.start,
        periodEnd: range.end,
        ...(total.trim()
          ? { totalLimitMinor: parseMoneyInputToMinorUnits(total) }
          : {}),
        status,
        allocations: expenseCategories.flatMap((category) => {
          const value = limits[category.id];
          return value?.trim()
            ? [
                {
                  categoryId: category.id,
                  limitMinor: parseMoneyInputToMinorUnits(value),
                  warningThresholdPercent: thresholds[category.id] ?? 80,
                },
              ]
            : [];
        }),
      };
      mutation.mutate(input, {
        onSuccess: () => onOpenChange(false),
        onError: (caught) => setError(caught.message),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Zkontrolujte zadané částky.',
      );
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nový rozpočet"
      description="Limity jsou v jedné měně a převody se do čerpání nepočítají."
      size="lg"
      mobileFullScreen
    >
      <form className="grid gap-6" onSubmit={submit}>
        {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
        <section
          className="grid gap-4 sm:grid-cols-2"
          aria-labelledby="budget-basic-title"
        >
          <h3
            id="budget-basic-title"
            className="sm:col-span-2 text-section-title font-semibold"
          >
            Základní údaje
          </h3>
          <Input
            label="Název"
            value={name}
            required
            onChange={(event) => setName(event.target.value)}
          />
          <Select
            label="Měna"
            value={currencyCode}
            onChange={(event) =>
              setCurrency(event.target.value as 'CZK' | 'EUR')
            }
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
          </Select>
          <Select
            label="Období"
            value={periodType}
            onChange={(event) =>
              setPeriodType(event.target.value as 'MONTHLY' | 'CUSTOM')
            }
          >
            <option value="MONTHLY">Kalendářní měsíc</option>
            <option value="CUSTOM">Vlastní období</option>
          </Select>
          {periodType === 'MONTHLY' ? (
            <Input
              label="Měsíc"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          ) : (
            <>
              <DatePicker
                label="Začátek období"
                value={periodStart}
                onChange={setPeriodStart}
              />
              <DatePicker
                label="Konec období"
                value={periodEnd}
                onChange={setPeriodEnd}
              />
            </>
          )}
          <Input
            label="Celkový limit"
            inputMode="decimal"
            value={total}
            placeholder="např. 25 000"
            onChange={(event) => setTotal(event.target.value)}
            hint="Volitelné; kategoriální limity mohou existovat samostatně."
          />
          <Select
            label="Po vytvoření"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'DRAFT' | 'ACTIVE')
            }
          >
            <option value="DRAFT">Uložit jako koncept</option>
            <option value="ACTIVE">Aktivovat</option>
          </Select>
        </section>
        <section
          className="grid gap-3"
          aria-labelledby="budget-categories-title"
        >
          <div>
            <h3
              id="budget-categories-title"
              className="text-section-title font-semibold"
            >
              Limity kategorií
            </h3>
            <p className="mt-1 text-body-sm text-text-muted">
              Prázdná kategorie zůstane bez vlastního limitu, ale započítá se do
              celku.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {expenseCategories.map((category) => (
              <BudgetCategoryLimitField
                key={category.id}
                name={category.name}
                limit={limits[category.id] ?? ''}
                threshold={thresholds[category.id] ?? 80}
                onLimitChange={(value) =>
                  setLimits((current) => ({ ...current, [category.id]: value }))
                }
                onThresholdChange={(value) =>
                  setThresholds((current) => ({
                    ...current,
                    [category.id]: value,
                  }))
                }
              />
            ))}
          </div>
          {parsedTotal !== null && allocationTotal > parsedTotal ? (
            <InlineAlert variant="warning">
              Součet kategoriálních limitů je vyšší než celkový limit. Rozpočet
              lze uložit, ale zkontrolujte záměr.
            </InlineAlert>
          ) : null}
        </section>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            Uložit rozpočet
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
