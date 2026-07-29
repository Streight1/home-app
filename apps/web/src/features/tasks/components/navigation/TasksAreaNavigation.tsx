import { ListTodo, Wrench } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Select } from '../../../../components/ui/Select/Select.js';

type TasksArea = 'tasks' | 'maintenance';

const tasksAreas = [
  {
    value: 'tasks',
    label: 'Úkoly',
    icon: ListTodo,
  },
  {
    value: 'maintenance',
    label: 'Údržba',
    icon: Wrench,
  },
] as const satisfies readonly {
  value: TasksArea;
  label: string;
  icon: typeof ListTodo;
}[];

export function TasksAreaNavigation() {
  const workspace = useWorkspaceNavigation();
  const activeArea: TasksArea =
    workspace.view.area === 'maintenance' ? 'maintenance' : 'tasks';

  function navigate(area: TasksArea) {
    workspace.navigate(
      area === 'maintenance'
        ? { area: 'maintenance', screen: 'overview' }
        : { area: 'tasks', screen: 'list' },
    );
  }

  return (
    <nav aria-label="Oblasti Úkolů">
      <div className="sm:hidden">
        <Select
          label="Oblast Úkolů"
          value={activeArea}
          onChange={(event) => navigate(event.target.value as TasksArea)}
        >
          {tasksAreas.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </Select>
      </div>
      <div
        className="hidden w-fit gap-1 rounded-lg border border-border bg-surface-raised p-1 sm:flex"
        role="tablist"
        aria-label="Oblasti plánovaných činností"
      >
        {tasksAreas.map((area) => {
          const Icon = area.icon;
          const active = area.value === activeArea;
          return (
            <button
              key={area.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-body-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-focus ${
                active
                  ? 'bg-selected-surface text-primary-emphasis'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
              }`}
              onClick={() => navigate(area.value)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {area.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
