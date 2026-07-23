import { createContext } from 'react';
import type { WorkspaceNavigationValue } from './workspace-navigation.types.js';

export const WorkspaceNavigationContext =
  createContext<WorkspaceNavigationValue | null>(null);
