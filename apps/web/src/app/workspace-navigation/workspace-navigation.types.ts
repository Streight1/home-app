export type WorkspaceView =
  | { area: 'dashboard' }
  | {
      area: 'documents';
      screen: 'list' | 'new' | 'trash';
    }
  | {
      area: 'documents';
      screen: 'detail' | 'preview' | 'extraction';
      documentId: string;
    }
  | { area: 'tasks'; screen: 'list' }
  | { area: 'tasks'; screen: 'detail'; taskId: string }
  | { area: 'calendar'; screen: 'calendar' }
  | { area: 'calendar'; screen: 'detail'; eventId: string }
  | { area: 'bucket-list'; screen: 'overview' }
  | { area: 'bucket-list'; screen: 'item'; itemId: string }
  | {
      area: 'finance';
      screen:
        | 'overview'
        | 'accounts'
        | 'categories'
        | 'imports'
        | 'analytics'
        | 'rules'
        | 'budgets'
        | 'insights'
        | 'recurring';
    }
  | {
      area: 'finance';
      screen: 'transactions';
      filters?: {
        query?: string;
        categoryId?: string;
        dateFrom?: string;
        dateTo?: string;
      };
    }
  | { area: 'finance'; screen: 'detail'; transactionId: string }
  | { area: 'settings'; screen: 'general' };

export type WorkspaceOverlay =
  | { kind: 'task-create' }
  | { kind: 'document-preview'; documentId: string }
  | { kind: 'calendar-create'; date?: string }
  | { kind: 'calendar-edit'; eventId: string }
  | { kind: 'finance-transaction'; type: 'expense' | 'income' }
  | { kind: 'bucket-list-item-create'; listId: string }
  | { kind: 'theme-selector' };

export interface WorkspaceNavigationState {
  view: WorkspaceView;
  overlay?: WorkspaceOverlay;
}

export interface WorkspaceNavigationValue extends WorkspaceNavigationState {
  navigate: (view: WorkspaceView, options?: { replace?: boolean }) => void;
  openOverlay: (overlay: WorkspaceOverlay) => void;
  closeOverlay: () => void;
  clear: () => void;
}

export const dashboardWorkspaceView: WorkspaceView = { area: 'dashboard' };
