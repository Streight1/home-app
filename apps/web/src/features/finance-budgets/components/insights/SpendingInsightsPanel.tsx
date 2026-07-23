import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useFinanceBudgetMutations,
  useSpendingInsights,
} from '../../hooks/useFinanceBudgets.js';
import { SpendingInsightCard } from './SpendingInsightCard.js';
import { InsightComparisonChart } from '../charts/InsightComparisonChart.js';

export function SpendingInsightsPanel({ canWrite }: { canWrite: boolean }) {
  const workspace = useWorkspaceNavigation();
  const insights = useSpendingInsights();
  const actions = useFinanceBudgetMutations();
  const [currency, setCurrency] = useState<'CZK' | 'EUR'>('CZK');
  return (
    <section className="grid gap-5" aria-labelledby="insights-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="insights-heading" className="text-page-title font-semibold">
            Kam mizí peníze
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Vysvětlitelná zjištění bez finančních rad a bez slučování měn.
          </p>
        </div>
        {canWrite ? (
          <div className="flex items-end gap-2">
            <Select
              label="Měna analýzy"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as 'CZK' | 'EUR')
              }
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
            </Select>
            <Button
              loading={actions.refreshInsights.isPending}
              onClick={() => actions.refreshInsights.mutate(currency)}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Aktualizovat
            </Button>
          </div>
        ) : null}
      </div>
      {insights.isError || actions.refreshInsights.isError ? (
        <InlineAlert variant="danger">
          Zjištění se nepodařilo načíst nebo aktualizovat.
        </InlineAlert>
      ) : null}
      {insights.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={<Sparkles className="mx-auto size-5" aria-hidden="true" />}
          title="Zatím žádné významné odchylky"
          description="Trendová zjištění vyžadují alespoň dvě dokončená srovnatelná období. Jednorázové prahy se zobrazí dříve."
        />
      ) : null}
      <InsightComparisonChart insights={insights.data?.items ?? []} />
      <div className="grid gap-4 lg:grid-cols-2">
        {insights.data?.items.map((insight) => (
          <SpendingInsightCard
            key={insight.id}
            insight={insight}
            canWrite={canWrite}
            pending={actions.insightStatus.isPending}
            onAcknowledge={() =>
              actions.insightStatus.mutate({
                id: insight.id,
                action: 'acknowledge',
              })
            }
            onDismiss={() =>
              actions.insightStatus.mutate({
                id: insight.id,
                action: 'dismiss',
              })
            }
            onShowTransactions={() =>
              workspace.navigate({
                area: 'finance',
                screen: 'transactions',
                filters: insight.transactionFilter ?? {},
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
