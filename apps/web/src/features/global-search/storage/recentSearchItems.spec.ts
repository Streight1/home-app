import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllRecentSearchItems,
  readRecentSearchItems,
  storeRecentSearchItem,
} from './recentSearchItems.js';

const userId = '10000000-0000-4000-8000-000000000001';

describe('search recent items', () => {
  beforeEach(() => localStorage.clear());

  it('stores only a validated safe target and never persists a snippet', () => {
    storeRecentSearchItem(userId, {
      providerKey: 'tasks',
      entityKind: 'TASK',
      title: 'Revize kotle',
      navigationTarget: {
        area: 'tasks',
        screen: 'detail',
        taskId: '20000000-0000-4000-8000-000000000002',
      },
      openedAt: '2026-07-31T10:00:00.000Z',
      ...({ snippet: 'citlivý úryvek' } as object),
    });
    const serialized = localStorage.getItem(
      `homeapp.search.recent.v1.${userId}`,
    );
    expect(serialized).not.toContain('citlivý úryvek');
    expect(readRecentSearchItems(userId)).toHaveLength(1);
  });

  it('rejects invalid navigation state and clears per-device history on logout', () => {
    localStorage.setItem(
      `homeapp.search.recent.v1.${userId}`,
      JSON.stringify([
        {
          providerKey: 'tasks',
          entityKind: 'TASK',
          title: 'Neplatný cíl',
          navigationTarget: { area: 'tasks', screen: 'detail', taskId: '../x' },
          openedAt: '2026-07-31T10:00:00.000Z',
        },
      ]),
    );
    expect(readRecentSearchItems(userId)).toEqual([]);
    clearAllRecentSearchItems();
    expect(localStorage.length).toBe(0);
  });
});
