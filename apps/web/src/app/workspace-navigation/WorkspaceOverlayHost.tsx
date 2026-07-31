import { lazy, Suspense } from 'react';
import { Dialog } from '../../components/ui/Dialog/Dialog.js';
import { Spinner } from '../../components/ui/Spinner/Spinner.js';
import type { HouseholdRole } from '../../features/household/household.public.js';
import { loadLazyModuleWithRecovery } from './lazy-module-recovery.js';
import { useWorkspaceNavigation } from './useWorkspaceNavigation.js';

const DocumentPreviewDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-document-preview', async () => ({
    default: (await import('../../features/documents/documents.public.js'))
      .DocumentPreviewDialog,
  })),
);
const TaskCreateWorkspaceOverlay = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-task-create', async () => ({
    default: (await import('../../features/tasks/tasks.public.js'))
      .TaskCreateWorkspaceOverlay,
  })),
);
const EventCreateDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-calendar-create', async () => ({
    default: (await import('../../features/calendar/calendar.public.js'))
      .EventCreateDialog,
  })),
);
const EventEditDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-calendar-edit', async () => ({
    default: (await import('../../features/calendar/calendar.public.js'))
      .EventEditDialog,
  })),
);
const FinancialTransactionDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-finance-transaction', async () => ({
    default: (await import('../../features/finance/finance.public.js'))
      .FinancialTransactionDialog,
  })),
);
const BucketListItemDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-bucket-list-item', async () => ({
    default: (await import('../../features/bucket-list/bucket-list.public.js'))
      .BucketListItemDialog,
  })),
);
const MaintenancePlanDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-maintenance-plan', async () => ({
    default: (await import('../../features/maintenance/maintenance.public.js'))
      .MaintenancePlanDialog,
  })),
);
const RecipeDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-recipe-dialog', async () => ({
    default: (await import('../../features/meals/meals.public.js'))
      .RecipeDialog,
  })),
);
const MealPlanDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-meal-plan-dialog', async () => ({
    default: (await import('../../features/meals/meals.public.js'))
      .MealPlanDialog,
  })),
);
const ShoppingItemDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-shopping-item', async () => ({
    default: (await import('../../features/meals/meals.public.js'))
      .ShoppingItemDialog,
  })),
);
const GearItemDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-gear-item', async () => ({
    default: (await import('../../features/expeditions/expeditions.public.js'))
      .GearItemDialog,
  })),
);
const TripDialog = lazy(async () =>
  loadLazyModuleWithRecovery('overlay-trip-dialog', async () => ({
    default: (await import('../../features/expeditions/expeditions.public.js'))
      .TripDialog,
  })),
);

function WorkspaceOverlayLoadingFallback() {
  return (
    <Dialog
      open
      dismissible={false}
      size="sm"
      title="Načítáme dialog…"
      description="Připravujeme formulář."
    >
      <div
        className="flex items-center gap-3 text-body-sm text-text-secondary"
        role="status"
        aria-live="polite"
      >
        <Spinner />
        <span>Chvilku strpení.</span>
      </div>
    </Dialog>
  );
}

export function WorkspaceOverlayHost({ role }: { role: HouseholdRole }) {
  const workspace = useWorkspaceNavigation();
  const overlay = workspace.overlay;
  if (!overlay) return null;
  const close = workspace.closeOverlay;
  let content = null;
  if (overlay.kind === 'document-preview')
    content = (
      <DocumentPreviewDialog
        documentId={overlay.documentId}
        open
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'task-create' && role !== 'VIEWER')
    content = <TaskCreateWorkspaceOverlay onClose={close} />;
  if (overlay.kind === 'calendar-create' && role !== 'VIEWER')
    content = (
      <EventCreateDialog
        open
        onOpenChange={(open) => !open && close()}
        draft={overlay.draft}
      />
    );
  if (overlay.kind === 'calendar-edit' && role !== 'VIEWER')
    content = (
      <EventEditDialog
        eventId={overlay.eventId}
        open
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'finance-transaction' && role !== 'VIEWER')
    content = (
      <FinancialTransactionDialog
        open
        type={overlay.type}
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'bucket-list-item-create' && role !== 'VIEWER')
    content = (
      <BucketListItemDialog
        listId={overlay.listId}
        open
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'maintenance-plan-create' && role !== 'VIEWER')
    content = (
      <MaintenancePlanDialog open onOpenChange={(open) => !open && close()} />
    );
  if (overlay.kind === 'recipe-create' && role !== 'VIEWER')
    content = <RecipeDialog open onOpenChange={(open) => !open && close()} />;
  if (overlay.kind === 'recipe-edit' && role !== 'VIEWER')
    content = (
      <RecipeDialog
        open
        recipeId={overlay.recipeId}
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'meal-plan-create' && role !== 'VIEWER')
    content = (
      <MealPlanDialog
        open
        {...(overlay.plannedFor ? { plannedFor: overlay.plannedFor } : {})}
        {...(overlay.recipeId ? { recipeId: overlay.recipeId } : {})}
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'meal-plan-edit' && role !== 'VIEWER')
    content = (
      <MealPlanDialog
        open
        entryId={overlay.entryId}
        plannedFor={overlay.plannedFor}
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'shopping-item-create' && role !== 'VIEWER')
    content = (
      <ShoppingItemDialog
        open
        {...(overlay.listId ? { listId: overlay.listId } : {})}
        onOpenChange={(open) => !open && close()}
      />
    );
  if (overlay.kind === 'trip-create' && role !== 'VIEWER')
    content = <TripDialog open onOpenChange={(open) => !open && close()} />;
  if (overlay.kind === 'gear-item-create' && role !== 'VIEWER')
    content = <GearItemDialog open onOpenChange={(open) => !open && close()} />;
  return content ? (
    <Suspense fallback={<WorkspaceOverlayLoadingFallback />}>
      {content}
    </Suspense>
  ) : null;
}
