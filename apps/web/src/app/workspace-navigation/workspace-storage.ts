import {
  dashboardWorkspaceView,
  type WorkspaceNavigationState,
  type WorkspaceOverlay,
  type WorkspaceView,
} from './workspace-navigation.types.js';

export const WORKSPACE_STORAGE_KEY = 'homeapp.workspace.navigation';
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const date = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseView(value: unknown): WorkspaceView | null {
  if (!isRecord(value) || typeof value.area !== 'string') return null;
  if (value.area === 'dashboard') return dashboardWorkspaceView;
  if (value.area === 'documents') {
    if (
      value.screen === 'list' ||
      value.screen === 'new' ||
      value.screen === 'trash'
    )
      return { area: 'documents', screen: value.screen };
    if (
      (value.screen === 'detail' ||
        value.screen === 'preview' ||
        value.screen === 'extraction') &&
      typeof value.documentId === 'string' &&
      uuid.test(value.documentId)
    )
      return {
        area: 'documents',
        screen: value.screen,
        documentId: value.documentId,
      };
  }
  if (value.area === 'tasks' || value.area === 'agenda') {
    if (value.screen === 'list') return { area: 'tasks', screen: 'list' };
    if (
      value.screen === 'detail' &&
      typeof value.taskId === 'string' &&
      uuid.test(value.taskId)
    )
      return { area: 'tasks', screen: 'detail', taskId: value.taskId };
  }
  if (value.area === 'calendar') {
    if (value.screen === 'calendar')
      return { area: 'calendar', screen: 'calendar' };
    if (
      value.screen === 'detail' &&
      typeof value.eventId === 'string' &&
      uuid.test(value.eventId)
    )
      return { area: 'calendar', screen: 'detail', eventId: value.eventId };
  }
  if (value.area === 'bucket-list') {
    if (value.screen === 'overview')
      return { area: 'bucket-list', screen: 'overview' };
    if (
      value.screen === 'item' &&
      typeof value.itemId === 'string' &&
      uuid.test(value.itemId)
    )
      return { area: 'bucket-list', screen: 'item', itemId: value.itemId };
  }
  if (value.area === 'finance') {
    if (value.screen === 'transactions') {
      const filters = isRecord(value.filters)
        ? {
            ...(typeof value.filters.query === 'string'
              ? { query: value.filters.query.slice(0, 200) }
              : {}),
            ...(typeof value.filters.categoryId === 'string' &&
            uuid.test(value.filters.categoryId)
              ? { categoryId: value.filters.categoryId }
              : {}),
            ...(typeof value.filters.dateFrom === 'string' &&
            date.test(value.filters.dateFrom)
              ? { dateFrom: value.filters.dateFrom }
              : {}),
            ...(typeof value.filters.dateTo === 'string' &&
            date.test(value.filters.dateTo)
              ? { dateTo: value.filters.dateTo }
              : {}),
          }
        : undefined;
      return {
        area: 'finance',
        screen: 'transactions',
        ...(filters && Object.keys(filters).length ? { filters } : {}),
      };
    }
    if (
      value.screen === 'overview' ||
      value.screen === 'accounts' ||
      value.screen === 'categories' ||
      value.screen === 'imports' ||
      value.screen === 'analytics' ||
      value.screen === 'rules' ||
      value.screen === 'budgets' ||
      value.screen === 'insights' ||
      value.screen === 'recurring'
    )
      return { area: 'finance', screen: value.screen };
    if (
      value.screen === 'detail' &&
      typeof value.transactionId === 'string' &&
      uuid.test(value.transactionId)
    )
      return {
        area: 'finance',
        screen: 'detail',
        transactionId: value.transactionId,
      };
  }
  if (value.area === 'settings' && value.screen === 'general')
    return { area: 'settings', screen: 'general' };
  return null;
}

function parseOverlay(value: unknown): WorkspaceOverlay | null {
  if (!isRecord(value) || typeof value.kind !== 'string') return null;
  if (value.kind === 'task-create' || value.kind === 'agenda-create')
    return { kind: 'task-create' };
  if (value.kind === 'theme-selector') return { kind: value.kind };
  if (
    value.kind === 'finance-transaction' &&
    (value.type === 'expense' || value.type === 'income')
  )
    return { kind: value.kind, type: value.type };
  if (
    value.kind === 'document-preview' &&
    typeof value.documentId === 'string' &&
    uuid.test(value.documentId)
  )
    return { kind: value.kind, documentId: value.documentId };
  if (value.kind === 'calendar-create')
    return {
      kind: value.kind,
      ...(typeof value.date === 'string' && date.test(value.date)
        ? { date: value.date }
        : {}),
    };
  if (
    value.kind === 'calendar-edit' &&
    typeof value.eventId === 'string' &&
    uuid.test(value.eventId)
  )
    return { kind: value.kind, eventId: value.eventId };
  if (
    value.kind === 'bucket-list-item-create' &&
    typeof value.listId === 'string' &&
    uuid.test(value.listId)
  )
    return { kind: value.kind, listId: value.listId };
  return null;
}

export function parseWorkspaceState(
  value: unknown,
): WorkspaceNavigationState | null {
  if (!isRecord(value)) return null;
  const view = parseView(value.view);
  if (!view) return null;
  const overlay =
    value.overlay === undefined ? undefined : parseOverlay(value.overlay);
  if (value.overlay !== undefined && !overlay) return null;
  return { view, ...(overlay ? { overlay } : {}) };
}

export function loadWorkspaceState(): WorkspaceNavigationState {
  try {
    const stored = sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
    return stored
      ? (parseWorkspaceState(JSON.parse(stored) as unknown) ?? {
          view: dashboardWorkspaceView,
        })
      : { view: dashboardWorkspaceView };
  } catch {
    return { view: dashboardWorkspaceView };
  }
}

export function storeWorkspaceState(state: WorkspaceNavigationState): void {
  sessionStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
}

export function clearWorkspaceState(): void {
  sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
}
