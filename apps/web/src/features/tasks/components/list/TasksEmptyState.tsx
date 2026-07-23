import { ListChecks } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { Button } from '../../../../components/ui/Button/Button.js';

export function TasksEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      eyebrow={<ListChecks className="mx-auto size-6" aria-hidden="true" />}
      title="Tady je zatím hotovo."
      description="V tomto pohledu nejsou žádné úkoly. Přidejte první povinnost nebo termín domácnosti."
      action={
        onCreate ? (
          <Button variant="primary" onClick={onCreate}>
            Přidat úkol
          </Button>
        ) : undefined
      }
    />
  );
}
