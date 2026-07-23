import { ChevronLeft } from 'lucide-react';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../components/ui/Badge/Badge.js';
import { BrandMark } from '../../components/ui/BrandMark/BrandMark.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import {
  desktopNavigation,
  workspaceViewForArea,
} from './navigation.config.js';

export function DesktopSidebar({ onCollapse }: { onCollapse: () => void }) {
  const workspace = useWorkspaceNavigation();
  return (
    <aside className="fixed inset-y-0 left-0 z-(--z-sticky) hidden w-(--navigation-sidebar-width) border-r border-border bg-sidebar xl:flex xl:flex-col">
      <div className="flex h-(--navigation-topbar-height) items-center gap-3 border-b border-border px-4">
        <BrandMark />
        <IconButton
          aria-label="Sbalit navigaci"
          variant="ghost"
          className="ml-auto"
          onClick={onCollapse}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </IconButton>
      </div>
      <nav aria-label="Hlavní navigace" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {desktopNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.area === workspace.view.area;
            const className = `flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-body-sm font-medium transition-colors ${active ? 'aurora-active-indicator bg-selected text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover hover:text-text'} disabled:cursor-not-allowed disabled:text-text-subtle disabled:opacity-70`;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={!item.available || !item.area}
                  aria-current={active ? 'page' : undefined}
                  className={className}
                  onClick={() =>
                    item.area &&
                    workspace.navigate(workspaceViewForArea(item.area))
                  }
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {!item.available ? <Badge>Připravujeme</Badge> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
