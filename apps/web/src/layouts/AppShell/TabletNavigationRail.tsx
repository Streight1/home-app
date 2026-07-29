import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import { Tooltip } from '../../components/ui/Tooltip/Tooltip.js';
import {
  desktopNavigation,
  getPrimaryNavigationArea,
  workspaceViewForArea,
} from './navigation.config.js';
import { HomeBrandButton } from './HomeBrandButton.js';

export function TabletNavigationRail() {
  const workspace = useWorkspaceNavigation();
  const activeArea = getPrimaryNavigationArea(workspace.view);
  return (
    <aside className="fixed inset-y-0 left-0 z-(--z-sticky) hidden w-(--navigation-rail-width) border-r border-border bg-sidebar md:flex md:flex-col md:items-center xl:hidden">
      <div className="grid h-(--navigation-topbar-height) place-items-center border-b border-border">
        <HomeBrandButton compact />
      </div>
      <nav aria-label="Tabletová navigace" className="flex-1 py-3">
        <ul className="space-y-1">
          {desktopNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.area === activeArea;
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
