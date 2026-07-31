import { useHouseholdMembers } from '../../../household/household.public.js';
import { useTaskCategories } from '../../hooks/useTaskCategories.js';
import { TaskCreateDialog } from './TaskCreateDialog.js';

export function TaskCreateWorkspaceOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const members = useHouseholdMembers();
  const categories = useTaskCategories();
  const taskMembers = (members.data ?? []).map((member) => ({
    ...member,
    calendarColorToken: member.calendarColorToken ?? 'violet',
  }));
  return (
    <TaskCreateDialog
      open
      onOpenChange={(open) => !open && onClose()}
      members={taskMembers}
      categories={categories.data ?? []}
      quick
    />
  );
}
