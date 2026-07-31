import type { LucideIcon } from 'lucide-react';

export interface SearchCommand {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run: () => void;
}

export function SearchCommandList({
  commands,
  activeId,
  onRun,
}: {
  commands: SearchCommand[];
  activeId?: string;
  onRun: (command: SearchCommand) => void;
}) {
  return (
    <section role="group" aria-labelledby="search-actions-heading">
      <h2
        id="search-actions-heading"
        role="presentation"
        className="mb-2 text-caption font-semibold uppercase tracking-wider text-text-muted"
      >
        Rychlé akce
      </h2>
      <div className="grid gap-1" role="presentation">
        {commands.map((command) => {
          const Icon = command.icon;
          return (
            <button
              key={command.id}
              id={`search-option-${command.id}`}
              type="button"
              role="option"
              aria-selected={activeId === command.id}
              className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-focus ${activeId === command.id ? 'bg-selected-surface' : 'hover:bg-surface-hover'}`}
              onClick={() => onRun(command)}
            >
              <Icon
                className="size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-body-sm font-semibold">
                  {command.label}
                </span>
                <span className="block truncate text-caption text-text-muted">
                  {command.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
