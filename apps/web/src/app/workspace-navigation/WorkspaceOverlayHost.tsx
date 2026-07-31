import { DocumentPreviewDialog } from '../../features/documents/components/modals/DocumentPreviewDialog.js';
import { TaskCreateDialog } from '../../features/tasks/components/dialogs/TaskCreateDialog.js';
import { useTasks } from '../../features/tasks/hooks/useTasks.js';
import { useTaskCategories } from '../../features/tasks/hooks/useTaskCategories.js';
import type { HouseholdRole } from '../../features/tasks/types/task.types.js';
import { useWorkspaceNavigation } from './useWorkspaceNavigation.js';
import { EventCreateDialog } from '../../features/calendar/components/dialogs/EventCreateDialog.js';
import { EventEditDialog } from '../../features/calendar/components/dialogs/EventEditDialog.js';
import { FinancialTransactionDialog } from '../../features/finance/components/forms/FinancialTransactionDialog.js';
import { BucketListItemDialog } from '../../features/bucket-list/components/dialogs/BucketListItemDialog.js';
import { MaintenancePlanDialog } from '../../features/maintenance/maintenance.public.js';
import { RecipeDialog } from '../../features/meals/components/dialogs/RecipeDialog.js';
import { MealPlanDialog } from '../../features/meals/components/dialogs/MealPlanDialog.js';
import { ShoppingItemDialog } from '../../features/meals/components/dialogs/ShoppingItemDialog.js';
import { GearItemDialog } from '../../features/expeditions/components/dialogs/GearItemDialog.js';
import { TripDialog } from '../../features/expeditions/components/dialogs/TripDialog.js';

function TaskCreateOverlay() {
  const workspace = useWorkspaceNavigation();
  const tasks = useTasks({ view: 'all', page: 1, pageSize: 10 });
  const categories = useTaskCategories();
  return (
    <TaskCreateDialog
      open
      onOpenChange={(open) => !open && workspace.closeOverlay()}
      members={tasks.data?.members ?? []}
      categories={categories.data ?? []}
      quick
    />
  );
}

export function WorkspaceOverlayHost({ role }: { role: HouseholdRole }) {
  const workspace = useWorkspaceNavigation();
  const overlay = workspace.overlay;
  if (!overlay) return null;
  if (overlay.kind === 'document-preview')
    return (
      <DocumentPreviewDialog
        documentId={overlay.documentId}
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'task-create' && role !== 'VIEWER')
    return <TaskCreateOverlay />;
  if (overlay.kind === 'calendar-create' && role !== 'VIEWER')
    return (
      <EventCreateDialog
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
        draft={overlay.draft}
      />
    );
  if (overlay.kind === 'calendar-edit' && role !== 'VIEWER')
    return (
      <EventEditDialog
        eventId={overlay.eventId}
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'finance-transaction' && role !== 'VIEWER')
    return (
      <FinancialTransactionDialog
        open
        type={overlay.type}
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'bucket-list-item-create' && role !== 'VIEWER')
    return (
      <BucketListItemDialog
        listId={overlay.listId}
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'maintenance-plan-create' && role !== 'VIEWER')
    return (
      <MaintenancePlanDialog
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'recipe-create' && role !== 'VIEWER')
    return (
      <RecipeDialog
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'recipe-edit' && role !== 'VIEWER')
    return (
      <RecipeDialog
        open
        recipeId={overlay.recipeId}
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'meal-plan-create' && role !== 'VIEWER')
    return (
      <MealPlanDialog
        open
        {...(overlay.plannedFor ? { plannedFor: overlay.plannedFor } : {})}
        {...(overlay.recipeId ? { recipeId: overlay.recipeId } : {})}
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'meal-plan-edit' && role !== 'VIEWER')
    return (
      <MealPlanDialog
        open
        entryId={overlay.entryId}
        plannedFor={overlay.plannedFor}
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'shopping-item-create' && role !== 'VIEWER')
    return (
      <ShoppingItemDialog
        open
        {...(overlay.listId ? { listId: overlay.listId } : {})}
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'trip-create' && role !== 'VIEWER')
    return (
      <TripDialog
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  if (overlay.kind === 'gear-item-create' && role !== 'VIEWER')
    return (
      <GearItemDialog
        open
        onOpenChange={(open) => !open && workspace.closeOverlay()}
      />
    );
  return null;
}
