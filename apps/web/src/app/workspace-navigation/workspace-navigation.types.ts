export type CalendarEventDraftSource =
  | 'calendar-toolbar'
  | 'month-day-double-click'
  | 'time-slot-double-click'
  | 'dashboard'
  | 'global-add'
  | 'task-conversion';

export interface CalendarEventDraft {
  source: CalendarEventDraftSource;
  date: string;
  startTime: string;
  durationMinutes: number;
  isAllDay: false;
}

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
      area: 'maintenance';
      screen: 'overview' | 'plans' | 'history' | 'categories';
    }
  | { area: 'maintenance'; screen: 'plan'; planId: string }
  | {
      area: 'meals';
      screen: 'planner' | 'recipes' | 'shopping' | 'pantry';
    }
  | { area: 'meals'; screen: 'recipe'; recipeId: string }
  | {
      area: 'expeditions';
      screen: 'overview' | 'trips' | 'templates' | 'gear';
    }
  | { area: 'expeditions'; screen: 'gear'; gearItemId: string }
  | { area: 'expeditions'; screen: 'templates'; templateId: string }
  | { area: 'expeditions'; screen: 'trip'; tripId: string }
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
  | { kind: 'calendar-create'; draft: CalendarEventDraft }
  | { kind: 'calendar-edit'; eventId: string }
  | { kind: 'finance-transaction'; type: 'expense' | 'income' }
  | { kind: 'bucket-list-item-create'; listId: string }
  | { kind: 'maintenance-plan-create' }
  | { kind: 'recipe-create' }
  | { kind: 'recipe-edit'; recipeId: string }
  | { kind: 'meal-plan-create'; plannedFor?: string; recipeId?: string }
  | { kind: 'meal-plan-edit'; entryId: string; plannedFor: string }
  | { kind: 'shopping-item-create'; listId?: string }
  | { kind: 'trip-create' }
  | { kind: 'gear-item-create' }
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
