import { Edit3, Trash2, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';

export function CalendarSelectionToolbar({
  selectedCount,
  selectableCount,
  onSelectAll,
  onClear,
  onEdit,
  onDelete,
  onExit,
}: {
  selectedCount: number;
  selectableCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExit: () => void;
}) {
  return (
    <aside
      className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-lg border border-border-strong bg-surface-raised p-3 shadow-md"
      aria-label="Hromadné operace kalendáře"
      aria-live="polite"
    >
      <strong className="mr-auto text-body-sm">
        Vybráno: {String(selectedCount)} z {String(selectableCount)}
      </strong>
      <Button size="sm" onClick={onSelectAll}>
        Vybrat vše v zobrazení
      </Button>
      <Button size="sm" disabled={!selectedCount} onClick={onClear}>
        Zrušit výběr
      </Button>
      <Button size="sm" disabled={!selectedCount} onClick={onEdit}>
        <Edit3 className="size-4" aria-hidden="true" />
        Upravit vybrané
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={!selectedCount}
        onClick={onDelete}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Smazat vybrané
      </Button>
      <Button size="sm" onClick={onExit}>
        <X className="size-4" aria-hidden="true" />
        Ukončit
      </Button>
    </aside>
  );
}
