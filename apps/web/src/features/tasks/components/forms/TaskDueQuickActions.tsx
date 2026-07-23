import { Button } from '../../../../components/ui/Button/Button.js';

function today(): string {
  const date = new Date();
  return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function TaskDueQuickActions({
  onChange,
}: {
  onChange: (patch: { dueDate?: string; dueTime?: string }) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Rychlé nastavení termínu">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange({ dueDate: today() })}
      >
        Dnes
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange({ dueTime: '' })}
      >
        Bez času
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange({ dueDate: '', dueTime: '' })}
      >
        Vymazat termín
      </Button>
    </div>
  );
}
