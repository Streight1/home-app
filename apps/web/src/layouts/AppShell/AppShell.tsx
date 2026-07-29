import { useState } from 'react';
import { webEnvironment } from '../../lib/config/environment.js';
import type { AppShellProps } from './app-shell.types.js';
import { AppTopBar } from './AppTopBar.js';
import { CollapsedSidebar } from './CollapsedSidebar.js';
import { DesktopSidebar } from './DesktopSidebar.js';
import { MobileBottomNavigation } from './MobileBottomNavigation.js';
import { MobileHeader } from './MobileHeader.js';
import { TabletNavigationRail } from './TabletNavigationRail.js';
import {
  readSidebarCollapsed,
  storeSidebarCollapsed,
} from './sidebarPreference.js';

export function AppShell({
  children,
  environmentLabel = webEnvironment.appEnvLabel,
  ...shellProps
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsedState] =
    useState(readSidebarCollapsed);
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    storeSidebarCollapsed(collapsed);
  };
  const desktopOffset = sidebarCollapsed
    ? 'xl:pl-(--navigation-rail-width)'
    : 'xl:pl-(--navigation-sidebar-width)';

  return (
    <div className="min-h-screen bg-canvas text-text">
      <a
        href="#main-content"
        className="aurora-primary-action fixed left-3 top-3 z-(--z-tooltip) -translate-y-24 rounded-md px-4 py-3 text-body-sm font-semibold text-primary-foreground focus:translate-y-0"
      >
        Přejít k hlavnímu obsahu
      </a>
      <MobileHeader {...shellProps} environmentLabel={environmentLabel} />
      <TabletNavigationRail />
      {sidebarCollapsed ? (
        <CollapsedSidebar onExpand={() => setSidebarCollapsed(false)} />
      ) : (
        <DesktopSidebar onCollapse={() => setSidebarCollapsed(true)} />
      )}
      <div
        className={`min-w-0 transition-[padding] duration-(--motion-standard) motion-reduce:transition-none md:pl-(--navigation-rail-width) ${desktopOffset}`}
      >
        <AppTopBar {...shellProps} environmentLabel={environmentLabel} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-(--layout-content-max) px-4 pb-[calc(var(--navigation-mobile-bottom-height)+var(--space-6)+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-10 md:pt-7 xl:px-8"
        >
          {children}
        </main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
