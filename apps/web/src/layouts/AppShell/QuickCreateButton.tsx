import {
  CalendarPlus,
  FilePlus2,
  ListPlus,
  Plus,
  ReceiptText,
  Wrench,
} from 'lucide-react';
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
import { useCreateCalendarEventDialog } from '../../features/calendar/hooks/useCreateCalendarEventDialog.js';

function PreparedActions({
  onAddDocument,
  onAddTask,
  onAddEvent,
  onAddExpense,
  onAddMaintenance,
}: {
  onAddDocument: () => void;
  onAddTask?: () => void;
  onAddEvent?: () => void;
  onAddExpense?: () => void;
  onAddMaintenance?: () => void;
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
      {onAddEvent ? (
        <Button className="justify-start" onClick={onAddEvent}>
          <CalendarPlus className="size-4" aria-hidden="true" />
          Nová událost
        </Button>
      ) : null}
      {onAddMaintenance ? (
        <Button className="justify-start" onClick={onAddMaintenance}>
          <Wrench className="size-4" aria-hidden="true" />
          Nový plán údržby
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
        Dokumenty, úkoly, kalendář, údržba a ruční finance používají společné
        bezpečné vytváření.
      </InlineAlert>
    </div>
  );
}

export function QuickCreateButton({ compact = false }: { compact?: boolean }) {
  const workspace = useWorkspaceNavigation();
  const auth = useCurrentUser();
  const openCreateEvent = useCreateCalendarEventDialog();
  const canAddTask = auth.data?.activeHousehold.role !== 'VIEWER';
  const canAddFinance = auth.data?.activeHousehold.role !== 'VIEWER';
  const canAddEvent = auth.data?.activeHousehold.role !== 'VIEWER';
  const canAddMaintenance = auth.data?.activeHousehold.role !== 'VIEWER';
  const addDocument = () =>
    workspace.navigate({ area: 'documents', screen: 'new' });
  const addTask = () => workspace.openOverlay({ kind: 'task-create' });
  const addExpense = () =>
    workspace.openOverlay({ kind: 'finance-transaction', type: 'expense' });
  const addEvent = () => openCreateEvent({ source: 'global-add' });
  const addMaintenance = () =>
    workspace.openOverlay({ kind: 'maintenance-plan-create' });
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
        {...(canAddEvent ? { onAddEvent: addEvent } : {})}
        {...(canAddMaintenance ? { onAddMaintenance: addMaintenance } : {})}
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
      {canAddEvent ? (
        <DropdownMenuItem onSelect={addEvent}>Nová událost</DropdownMenuItem>
      ) : null}
      {canAddMaintenance ? (
        <DropdownMenuItem onSelect={addMaintenance}>
          Nový plán údržby
        </DropdownMenuItem>
      ) : null}
      {canAddFinance ? (
        <DropdownMenuItem onSelect={addExpense}>Přidat výdaj</DropdownMenuItem>
      ) : null}
    </DropdownMenu>
  );
}
