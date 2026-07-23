import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../components/ui/Input/Input.js';
import { Select } from '../../../components/ui/Select/Select.js';
import { useFinancialCategories } from '../../finance/hooks/useFinance.js';
import {
  useCategorizationMutations,
  useCategorizationRules,
} from '../hooks/useFinanceCategorization.js';
import type { CategorizationRuleInput } from '../types/categorization.types.js';

const initial: CategorizationRuleInput = {
  name: '',
  priority: 100,
  enabled: true,
  field: 'COUNTERPARTY_NAME',
  operator: 'CONTAINS',
  comparisonValue: '',
  categoryId: '',
};
export function CategorizationRulesPanel({ canWrite }: { canWrite: boolean }) {
  const rules = useCategorizationRules();
  const categories = useFinancialCategories();
  const mutations = useCategorizationMutations();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.comparisonValue.trim() || !form.categoryId)
      return setError('Vyplňte název, porovnávanou hodnotu a kategorii.');
    mutations.create.mutate(
      {
        ...form,
        name: form.name.trim(),
        comparisonValue: form.comparisonValue.trim(),
      },
      {
        onSuccess: () => setForm(initial),
        onError: (cause) =>
          setError(
            cause instanceof Error
              ? cause.message
              : 'Pravidlo se nepodařilo uložit.',
          ),
      },
    );
  };
  if (rules.isError)
    return (
      <InlineAlert variant="danger">Pravidla se nepodařilo načíst.</InlineAlert>
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <h2 className="text-section-title font-semibold">
          Automatická pravidla
        </h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Vyšší priorita se vyhodnotí dříve a první shoda vítězí.
        </p>
        <div className="mt-4">
          {rules.isPending ? (
            <p role="status">Načítáme pravidla…</p>
          ) : rules.data.items.length ? (
            <div className="grid gap-2">
              {rules.data.items.map((rule) => (
                <article
                  key={rule.id}
                  className="rounded-md bg-surface-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="mt-1 text-caption text-text-muted">
                        {rule.field} · {rule.operator} · „{rule.comparisonValue}
                        “ · priorita {rule.priority}
                      </p>
                    </div>
                    {canWrite ? (
                      <Button
                        variant="ghost"
                        loading={
                          mutations.delete.isPending &&
                          mutations.delete.variables === rule.id
                        }
                        onClick={() => mutations.delete.mutate(rule.id)}
                      >
                        Odstranit
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title="Žádná pravidla"
              description="Importované i ruční transakce zatím zůstávají beze změny."
            />
          )}
        </div>
      </section>
      {canWrite ? (
        <form
          className="grid content-start gap-4 rounded-lg border border-border bg-surface-raised p-5"
          onSubmit={submit}
        >
          <h2 className="text-section-title font-semibold">Nové pravidlo</h2>
          <Input
            label="Název pravidla"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Pole"
              value={form.field}
              onChange={(event) =>
                setForm({
                  ...form,
                  field: event.target.value as CategorizationRuleInput['field'],
                })
              }
            >
              <option value="COUNTERPARTY_NAME">Obchodník</option>
              <option value="COUNTERPARTY_ACCOUNT">Účet protistrany</option>
              <option value="DESCRIPTION">Popis</option>
              <option value="VARIABLE_SYMBOL">Variabilní symbol</option>
            </Select>
            <Select
              label="Porovnání"
              value={form.operator}
              onChange={(event) =>
                setForm({
                  ...form,
                  operator: event.target
                    .value as CategorizationRuleInput['operator'],
                })
              }
            >
              <option value="CONTAINS">Obsahuje</option>
              <option value="EQUALS">Je přesně</option>
              <option value="STARTS_WITH">Začíná na</option>
            </Select>
          </div>
          <Input
            label="Hodnota"
            value={form.comparisonValue}
            onChange={(event) =>
              setForm({ ...form, comparisonValue: event.target.value })
            }
          />
          <Select
            label="Kategorie"
            value={form.categoryId}
            onChange={(event) =>
              setForm({ ...form, categoryId: event.target.value })
            }
          >
            <option value="">Vyberte kategorii</option>
            {categories.data?.items
              .filter(
                (category) =>
                  !category.archivedAt && category.kind !== 'INCOME',
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </Select>
          <Input
            label="Priorita"
            type="number"
            min={-10000}
            max={10000}
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: Number(event.target.value) })
            }
          />
          {error ? (
            <p role="alert" className="text-body-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            loading={mutations.create.isPending}
          >
            Uložit pravidlo
          </Button>
        </form>
      ) : null}
    </div>
  );
}
