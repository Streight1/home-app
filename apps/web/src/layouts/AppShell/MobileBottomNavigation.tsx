import { useState } from 'react';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../components/ui/Badge/Badge.js';
import { Sheet } from '../../components/ui/Sheet/Sheet.js';
import { ThemeSelector } from '../../features/theme/components/ThemeSelector.js';
import {
  desktopNavigation,
  mobileNavigation,
  workspaceViewForArea,
} from './navigation.config.js';

export function MobileBottomNavigation() {
  const workspace = useWorkspaceNavigation();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <nav
      aria-label="Mobilní navigace"
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-border bg-bottom-navigation/95 backdrop-blur-sm md:hidden"
    >
      <ul className="grid h-(--navigation-mobile-bottom-height) grid-cols-5 px-1">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = item.area === workspace.view.area;
          const content = (
            <span
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? 'text-primary-emphasis' : 'text-text-muted'}`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </span>
          );
          return (
            <li key={item.label} className="grid place-items-stretch">
              {item.label === 'Více' ? (
                <Sheet
                  open={moreOpen}
                  onOpenChange={setMoreOpen}
                  side="bottom"
                  title="Další oblasti"
                  description="Další části společné domácnosti."
                  trigger={
                    <button type="button" aria-label="Více oblastí">
                      {content}
                    </button>
                  }
                >
                  <ul className="grid gap-2">
                    {desktopNavigation.slice(3).map((navigationItem) => {
                      const NavigationIcon = navigationItem.icon;
                      const navigationActive =
                        navigationItem.area === workspace.view.area;
                      return (
                        <li key={navigationItem.label}>
                          <button
                            type="button"
                            disabled={
                              !navigationItem.available || !navigationItem.area
                            }
                            aria-current={navigationActive ? 'page' : undefined}
                            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-body-sm ${navigationActive ? 'bg-selected text-primary-emphasis' : 'text-text-muted'} disabled:opacity-70`}
                            onClick={() => {
                              if (!navigationItem.area) return;
                              workspace.navigate(
                                workspaceViewForArea(navigationItem.area),
                              );
                              setMoreOpen(false);
                            }}
                          >
                            <NavigationIcon
                              className="size-5"
                              aria-hidden="true"
                            />
                            <span className="flex-1 text-left">
                              {navigationItem.label}
                            </span>
                            {!navigationItem.available ? (
                              <Badge>Připravujeme</Badge>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-5 border-t border-border pt-5">
                    <ThemeSelector />
                  </div>
                </Sheet>
              ) : (
                <button
                  type="button"
                  disabled={!item.available || !item.area}
                  aria-current={active ? 'page' : undefined}
                  className="rounded-md focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55"
                  onClick={() =>
                    item.area &&
                    workspace.navigate(workspaceViewForArea(item.area))
                  }
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
