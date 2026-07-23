import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import type { Task } from '../../types/task.types.js';

export function TaskCompletionHistory({
  completions,
}: {
  completions: Task['completions'];
}) {
  return (
    <section aria-labelledby="completion-history-title">
      <h2
        id="completion-history-title"
        className="text-section-title font-semibold"
      >
        Historie dokončení
      </h2>
      {completions.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            compact
            title="Zatím bez dokončení"
            description="Po dokončení úkolu se zde zachová termín výskytu, čas a člen domácnosti."
          />
        </div>
      ) : (
        <ol className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
          {completions.map((completion) => (
            <li key={completion.id} className="p-4">
              <p className="font-medium text-text">
                {new Date(completion.completedAt).toLocaleString('cs-CZ')}
              </p>
              <p className="mt-1 text-body-sm text-text-muted">
                Dokončil/a{' '}
                {completion.completedBy.displayName ??
                  completion.completedBy.email}
                {completion.occurrenceDueAt
                  ? ` · termín ${new Date(completion.occurrenceDueAt).toLocaleString('cs-CZ')}`
                  : ''}
              </p>
              {completion.note ? (
                <p className="mt-2 whitespace-pre-wrap text-body-sm text-text">
                  {completion.note}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
