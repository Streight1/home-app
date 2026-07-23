import { ChevronRight } from 'lucide-react';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { BrandMark } from '../../components/ui/BrandMark/BrandMark.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import { Tooltip } from '../../components/ui/Tooltip/Tooltip.js';
import {
  desktopNavigation,
  workspaceViewForArea,
} from './navigation.config.js';

export function CollapsedSidebar({ onExpand }: { onExpand: () => void }) {
  const workspace = useWorkspaceNavigation();
  return (
    <aside className="fixed inset-y-0 left-0 z-(--z-sticky) hidden w-(--navigation-rail-width) border-r border-border bg-sidebar xl:flex xl:flex-col xl:items-center">
      <div className="grid h-(--navigation-topbar-height) place-items-center border-b border-border">
        <BrandMark compact />
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
      <Tooltip content="Rozbalit navigaci">
        <IconButton
          aria-label="Rozbalit navigaci"
          variant="ghost"
          className="mb-3"
          onClick={onExpand}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </IconButton>
      </Tooltip>
    </aside>
  );
}
