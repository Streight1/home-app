import type { ReactNode } from 'react';
import { BrandMark } from '../../components/ui/BrandMark/BrandMark.js';
import { useWorkspaceNavigation } from '../../app/workspace-navigation/useWorkspaceNavigation.js';

export function HomeBrandButton({
  compact = false,
  className = '',
  children,
}: {
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const workspace = useWorkspaceNavigation();
  const goHome = () => {
    workspace.navigate({ area: 'dashboard' });
    window.requestAnimationFrame(() => {
      const main = document.querySelector<HTMLElement>('#main-content');
      main?.focus();
      document.documentElement.scrollTop = 0;
    });
  };
  return (
    <button
      type="button"
      aria-label="Přejít na domovskou stránku"
      onClick={goHome}
      className={`min-h-11 min-w-11 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <BrandMark compact={compact} />
        {children}
      </span>
    </button>
  );
}
