import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import type { WorkspaceView } from './workspace-navigation.types.js';
import { useWorkspaceNavigation } from './useWorkspaceNavigation.js';

interface WorkspaceLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> {
  view: WorkspaceView;
  children: ReactNode;
}

export function WorkspaceLink({
  view,
  children,
  onClick,
  ...props
}: WorkspaceLinkProps) {
  const workspace = useWorkspaceNavigation();
  const activate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    workspace.navigate(view);
  };
  return (
    <a href="/app" onClick={activate} {...props}>
      {children}
    </a>
  );
}
