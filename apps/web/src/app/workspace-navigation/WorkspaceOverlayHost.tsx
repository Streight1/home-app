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
        {...(overlay.date ? { date: overlay.date } : {})}
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
  return null;
}
