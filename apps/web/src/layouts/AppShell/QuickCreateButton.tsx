import { FilePlus2, ListPlus, Plus, ReceiptText } from 'lucide-react';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../components/ui/Button/Button.js';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '../../components/ui/DropdownMenu/DropdownMenu.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import { InlineAlert } from '../../components/ui/InlineAlert/InlineAlert.js';
import { Sheet } from '../../components/ui/Sheet/Sheet.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

function PreparedActions({
  onAddDocument,
  onAddTask,
  onAddExpense,
}: {
  onAddDocument: () => void;
  onAddTask?: () => void;
  onAddExpense?: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Button className="justify-start" onClick={onAddDocument}>
        <FilePlus2 className="size-4" aria-hidden="true" />
        Přidat dokument
      </Button>
      {onAddTask ? (
        <Button className="justify-start" onClick={onAddTask}>
          <ListPlus className="size-4" aria-hidden="true" />
          Přidat úkol
        </Button>
      ) : null}
      <Button
        disabled={!onAddExpense}
        className="justify-start"
        onClick={onAddExpense}
      >
        <ReceiptText className="size-4" aria-hidden="true" />
        Přidat výdaj
      </Button>
      <InlineAlert>
        Dokumenty, úkoly a ruční finance jsou připravené. Další oblasti budeme
        zpřístupňovat postupně.
      </InlineAlert>
    </div>
  );
}

export function QuickCreateButton({ compact = false }: { compact?: boolean }) {
  const workspace = useWorkspaceNavigation();
  const auth = useCurrentUser();
  const canAddTask = auth.data?.activeHousehold.role !== 'VIEWER';
  const canAddFinance = auth.data?.activeHousehold.role !== 'VIEWER';
  const addDocument = () =>
    workspace.navigate({ area: 'documents', screen: 'new' });
  const addTask = () => workspace.openOverlay({ kind: 'task-create' });
  const addExpense = () =>
    workspace.openOverlay({ kind: 'finance-transaction', type: 'expense' });
  return compact ? (
    <Sheet
      side="bottom"
      title="Rychlé přidání"
      description="Vyberte oblast, kterou chcete doplnit."
      trigger={
        <IconButton aria-label="Rychlé přidání" variant="ghost">
          <Plus className="size-5" aria-hidden="true" />
        </IconButton>
      }
    >
      <PreparedActions
        onAddDocument={addDocument}
        {...(canAddTask ? { onAddTask: addTask } : {})}
        {...(canAddFinance ? { onAddExpense: addExpense } : {})}
      />
    </Sheet>
  ) : (
    <DropdownMenu
      label="Rychlé přidání"
      trigger={
        <Button variant="primary">
          <Plus className="size-4" aria-hidden="true" />
          Přidat
        </Button>
      }
    >
      <DropdownMenuLabel>Rychlé přidání</DropdownMenuLabel>
      <DropdownMenuItem onSelect={addDocument}>
        Přidat dokument
      </DropdownMenuItem>
      {canAddTask ? (
        <DropdownMenuItem onSelect={addTask}>Přidat úkol</DropdownMenuItem>
      ) : null}
      {canAddFinance ? (
        <DropdownMenuItem onSelect={addExpense}>Přidat výdaj</DropdownMenuItem>
      ) : null}
    </DropdownMenu>
  );
}
