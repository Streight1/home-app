import {
  CalendarPlus,
  FilePlus2,
  ListPlus,
  Mountain,
  Plus,
  Backpack,
  ReceiptText,
  ShoppingBasket,
  Soup,
  Utensils,
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
  onAddRecipe,
  onAddMeal,
  onAddShoppingItem,
  onAddTrip,
  onAddGear,
}: {
  onAddDocument: () => void;
  onAddTask?: () => void;
  onAddEvent?: () => void;
  onAddExpense?: () => void;
  onAddMaintenance?: () => void;
  onAddRecipe?: () => void;
  onAddMeal?: () => void;
  onAddShoppingItem?: () => void;
  onAddTrip?: () => void;
  onAddGear?: () => void;
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
      {onAddRecipe ? (
        <Button className="justify-start" onClick={onAddRecipe}>
          <Utensils className="size-4" aria-hidden="true" />
          Nový recept
        </Button>
      ) : null}
      {onAddMeal ? (
        <Button className="justify-start" onClick={onAddMeal}>
          <Soup className="size-4" aria-hidden="true" />
          Naplánovat jídlo
        </Button>
      ) : null}
      {onAddShoppingItem ? (
        <Button className="justify-start" onClick={onAddShoppingItem}>
          <ShoppingBasket className="size-4" aria-hidden="true" />
          Přidat položku nákupu
        </Button>
      ) : null}
      {onAddTrip ? (
        <Button className="justify-start" onClick={onAddTrip}>
          <Mountain className="size-4" aria-hidden="true" />
          Nová výprava
        </Button>
      ) : null}
      {onAddGear ? (
        <Button className="justify-start" onClick={onAddGear}>
          <Backpack className="size-4" aria-hidden="true" />
          Nová položka výbavy
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
        Každá oblast používá svůj centrální a bezpečně validovaný formulář.
      </InlineAlert>
    </div>
  );
}

export function QuickCreateButton({ compact = false }: { compact?: boolean }) {
  const workspace = useWorkspaceNavigation();
  const auth = useCurrentUser();
  const openCreateEvent = useCreateCalendarEventDialog();
  // Keep the trigger mounted while the already guarded shell hydrates its
  // cached user summary. This avoids restarting the primary-action surface
  // animation after the first paint; an authenticated VIEWER still loses the
  // complete create control as soon as their role is available.
  const canWrite = auth.data?.activeHousehold.role !== 'VIEWER';
  const addDocument = () =>
    workspace.navigate({ area: 'documents', screen: 'new' });
  const addTask = () => workspace.openOverlay({ kind: 'task-create' });
  const addExpense = () =>
    workspace.openOverlay({ kind: 'finance-transaction', type: 'expense' });
  const addEvent = () => openCreateEvent({ source: 'global-add' });
  const addMaintenance = () =>
    workspace.openOverlay({ kind: 'maintenance-plan-create' });
  const addRecipe = () => workspace.openOverlay({ kind: 'recipe-create' });
  const addMeal = () => workspace.openOverlay({ kind: 'meal-plan-create' });
  const addShoppingItem = () =>
    workspace.openOverlay({ kind: 'shopping-item-create' });
  const addTrip = () => workspace.openOverlay({ kind: 'trip-create' });
  const addGear = () => workspace.openOverlay({ kind: 'gear-item-create' });
  if (!canWrite) return null;
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
        onAddTask={addTask}
        onAddEvent={addEvent}
        onAddMaintenance={addMaintenance}
        onAddRecipe={addRecipe}
        onAddMeal={addMeal}
        onAddShoppingItem={addShoppingItem}
        onAddTrip={addTrip}
        onAddGear={addGear}
        onAddExpense={addExpense}
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
      <DropdownMenuItem onSelect={addTask}>Přidat úkol</DropdownMenuItem>
      <DropdownMenuItem onSelect={addEvent}>Nová událost</DropdownMenuItem>
      <DropdownMenuItem onSelect={addMaintenance}>
        Nový plán údržby
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={addRecipe}>Nový recept</DropdownMenuItem>
      <DropdownMenuItem onSelect={addMeal}>Naplánovat jídlo</DropdownMenuItem>
      <DropdownMenuItem onSelect={addShoppingItem}>
        Přidat položku nákupu
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={addTrip}>Nová výprava</DropdownMenuItem>
      <DropdownMenuItem onSelect={addGear}>
        Nová položka výbavy
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={addExpense}>Přidat výdaj</DropdownMenuItem>
    </DropdownMenu>
  );
}
