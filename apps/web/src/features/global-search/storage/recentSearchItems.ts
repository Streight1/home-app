import { parseWorkspaceState } from '../../../app/workspace-navigation/workspace-storage.js';
import type { RecentSearchItem } from '../types/search.types.js';

const prefix = 'homeapp.search.recent.v1';
const maximumItems = 10;

function key(userId: string) {
  return `${prefix}.${userId}`;
}

function parse(value: unknown): RecentSearchItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const candidate = item as Record<string, unknown>;
    const state = parseWorkspaceState({ view: candidate.navigationTarget });
    if (
      !state ||
      typeof candidate.providerKey !== 'string' ||
      typeof candidate.entityKind !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.openedAt !== 'string'
    )
      return [];
    return [
      {
        providerKey: candidate.providerKey.slice(0, 40),
        entityKind: candidate.entityKind.slice(0, 60),
        title: candidate.title.slice(0, 200),
        navigationTarget: state.view,
        openedAt: candidate.openedAt,
      },
    ];
  });
}

export function readRecentSearchItems(userId: string): RecentSearchItem[] {
  try {
    return parse(JSON.parse(localStorage.getItem(key(userId)) ?? '[]'));
  } catch {
    return [];
  }
}

export function storeRecentSearchItem(
  userId: string,
  item: RecentSearchItem,
): RecentSearchItem[] {
  const safeItem: RecentSearchItem = {
    providerKey: item.providerKey.slice(0, 40),
    entityKind: item.entityKind.slice(0, 60),
    title: item.title.slice(0, 200),
    navigationTarget: item.navigationTarget,
    openedAt: item.openedAt,
  };
  const current = readRecentSearchItems(userId).filter(
    (entry) =>
      JSON.stringify(entry.navigationTarget) !==
      JSON.stringify(safeItem.navigationTarget),
  );
  const next = [safeItem, ...current].slice(0, maximumItems);
  localStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}

export function clearAllRecentSearchItems(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const storageKey = localStorage.key(index);
    if (storageKey?.startsWith(`${prefix}.`))
      localStorage.removeItem(storageKey);
  }
}
