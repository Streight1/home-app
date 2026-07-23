import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { TasksEmptyState } from '../../features/tasks/components/list/TasksEmptyState.js';
import { TasksToolbar } from '../../features/tasks/components/list/TasksToolbar.js';
import { TaskList } from '../../features/tasks/components/list/TaskList.js';
import { TaskCreateDialog } from '../../features/tasks/components/dialogs/TaskCreateDialog.js';
import { TaskSchedulingDialog } from '../../features/scheduling/components/TaskSchedulingDialog.js';
import {
  agendaCategories,
  agendaMembers,
  tasks,
} from '../fixtures/agenda.fixture.js';

function TasksScreen({ empty = false }: { empty?: boolean }) {
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid gap-6">
        <TasksToolbar
          view="today"
          query=""
          canCreate
          onViewChange={() => undefined}
          onQueryChange={() => undefined}
          onCreate={() => undefined}
          onFilters={() => undefined}
        />
        {empty ? (
          <TasksEmptyState onCreate={() => undefined} />
        ) : (
          <TaskList
            tasks={tasks}
            completingId={null}
            onComplete={() => undefined}
          />
        )}
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Tasks',
  component: TasksScreen,
  parameters: { route: '/app', workspace: 'tasks' },
} satisfies Meta<typeof TasksScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TasksDark: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'tasks' },
};
export const TasksLight: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'tasks' },
};
export const EmptyDark: Story = {
  args: { empty: true },
  parameters: { theme: 'dark', route: '/app', workspace: 'tasks' },
};

export const CreateDialog: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'tasks' },
  render: () => (
    <>
      <TasksScreen />
      <TaskCreateDialog
        open
        onOpenChange={() => undefined}
        members={agendaMembers}
        categories={agendaCategories}
        quick
      />
    </>
  ),
};

export const FullCreateDialog: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'tasks' },
  render: () => (
    <>
      <TasksScreen />
      <TaskCreateDialog
        open
        onOpenChange={() => undefined}
        members={agendaMembers}
        categories={agendaCategories}
      />
    </>
  ),
};

export const SchedulingDialog: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'tasks' },
  render: () => (
    <>
      <TasksScreen />
      <TaskSchedulingDialog
        task={tasks[0] ?? null}
        open
        onOpenChange={() => undefined}
      />
    </>
  ),
};
