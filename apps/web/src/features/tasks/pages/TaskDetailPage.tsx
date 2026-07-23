import { useState } from 'react';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import { TaskCancelDialog } from '../components/dialogs/TaskCancelDialog.js';
import { TaskCompleteDialog } from '../components/dialogs/TaskCompleteDialog.js';
import { TaskEditDialog } from '../components/dialogs/TaskEditDialog.js';
import { TaskDetail } from '../components/detail/TaskDetail.js';
import { TaskDetailHeader } from '../components/detail/TaskDetailHeader.js';
import { useTask } from '../hooks/useTask.js';
import { useTasks } from '../hooks/useTasks.js';
import { useArchiveTask, useReopenTask } from '../hooks/useTaskMutations.js';
import { useTaskCategories } from '../hooks/useTaskCategories.js';
import { taskErrorMessage } from '../lib/taskErrorMessage.js';
import { TaskSchedulingDialog } from '../../scheduling/components/TaskSchedulingDialog.js';
import { ScheduledTaskSummary } from '../../scheduling/components/ScheduledTaskSummary.js';

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const task = useTask(taskId);
  const members = useTasks({ view: 'all', page: 1, pageSize: 10 });
  const categories = useTaskCategories();
  const archive = useArchiveTask();
  const reopen = useReopenTask();
  const [editOpen, setEditOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  if (task.isLoading) return <LoadingScreen message="Načítáme úkol…" />;
  if (task.isError || !task.data)
    return (
      <InlineAlert variant="danger">{taskErrorMessage(task.error)}</InlineAlert>
    );
  const data = task.data;
  const actionError = archive.error ?? reopen.error;
  return (
    <div className="grid gap-7">
      <TaskDetailHeader
        task={data}
        onEdit={() => setEditOpen(true)}
        onComplete={() => setCompleteOpen(true)}
        onCancel={() => setCancelOpen(true)}
        onReopen={() => reopen.mutate(data.id)}
        onArchive={() => archive.mutate(data.id)}
        onSchedule={() => setSchedulingOpen(true)}
      />
      {actionError ? (
        <InlineAlert variant="danger">
          {taskErrorMessage(actionError)}
        </InlineAlert>
      ) : null}
      <TaskDetail task={data} />
      <ScheduledTaskSummary
        task={data}
        onReschedule={() => setSchedulingOpen(true)}
      />
      <TaskEditDialog
        task={data}
        open={editOpen}
        onOpenChange={setEditOpen}
        members={members.data?.members ?? []}
        categories={categories.data ?? []}
      />
      <TaskCompleteDialog
        task={data}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
      />
      <TaskCancelDialog
        task={data}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
      <TaskSchedulingDialog
        task={data}
        open={schedulingOpen}
        onOpenChange={setSchedulingOpen}
      />
    </div>
  );
}
