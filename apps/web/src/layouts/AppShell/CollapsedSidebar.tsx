import { ChevronRight } from 'lucide-react';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import { Tooltip } from '../../components/ui/Tooltip/Tooltip.js';
import {
  desktopNavigation,
  workspaceViewForArea,
} from './navigation.config.js';
import { HomeBrandButton } from './HomeBrandButton.js';

export function CollapsedSidebar({ onExpand }: { onExpand: () => void }) {
  const workspace = useWorkspaceNavigation();
  return (
    <aside className="fixed inset-y-0 left-0 z-(--z-sticky) hidden w-(--navigation-rail-width) border-r border-border bg-sidebar xl:flex xl:flex-col xl:items-center">
      <div className="grid gap-1 border-b border-border py-2">
        <HomeBrandButton compact className="mx-auto" />
        <Tooltip content="Rozbalit hlavní menu">
          <IconButton
            aria-label="Rozbalit hlavní menu"
            variant="ghost"
            className="mx-auto"
            onClick={onExpand}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </IconButton>
        </Tooltip>
      </div>
      <nav aria-label="Sbalená hlavní navigace" className="flex-1 py-3">
        <ul className="space-y-1">
          {desktopNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.area === workspace.view.area;
            return (
              <li key={item.label}>
                <Tooltip
                  content={`${item.label}${item.available ? '' : ' · připravujeme'}`}
                >
                  <IconButton
                    aria-label={item.label}
                    variant="ghost"
                    disabled={!item.available || !item.area}
                    className={
                      active
                        ? 'bg-selected text-primary-emphasis shadow-glow'
                        : ''
                    }
                    aria-current={active ? 'page' : undefined}
                    onClick={() =>
                      item.area &&
                      workspace.navigate(workspaceViewForArea(item.area))
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
