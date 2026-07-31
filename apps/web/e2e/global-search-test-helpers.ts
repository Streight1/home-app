import type { Page, Route } from '@playwright/test';

const userId = '10000000-0000-4000-8000-000000000001';

const fixtures = {
  document: {
    resultId: 'documents:DOCUMENT:11000000-0000-4000-8000-000000000001',
    providerKey: 'documents',
    entityKind: 'DOCUMENT',
    title: 'Revize kotle 2026',
    subtitle: 'Servisní protokol',
    snippet: 'Potvrzený dokument k pravidelné revizi.',
    matchedField: 'Název',
    iconKey: 'document',
    score: 1,
    navigationTarget: {
      area: 'documents',
      screen: 'detail',
      documentId: '11000000-0000-4000-8000-000000000001',
    },
  },
  task: {
    resultId: 'tasks:TASK:12000000-0000-4000-8000-000000000001',
    providerKey: 'tasks',
    entityKind: 'TASK',
    title: 'Zkontrolovat lékárničku',
    subtitle: 'Úkol · do 5. srpna',
    matchedField: 'Název',
    iconKey: 'task',
    score: 1,
    navigationTarget: {
      area: 'tasks',
      screen: 'detail',
      taskId: '12000000-0000-4000-8000-000000000001',
    },
  },
  recipe: {
    resultId: 'meals:RECIPE:13000000-0000-4000-8000-000000000001',
    providerKey: 'meals',
    entityKind: 'RECIPE',
    title: 'Rajčatové těstoviny',
    subtitle: 'Hlavní jídlo',
    snippet: 'Rychlý recept pro čtyři porce.',
    matchedField: 'Obsahuje: rajčata',
    iconKey: 'recipe',
    score: 0.96,
    navigationTarget: {
      area: 'meals',
      screen: 'recipe',
      recipeId: '13000000-0000-4000-8000-000000000001',
    },
  },
  trip: {
    resultId: 'expeditions:TRIP:14000000-0000-4000-8000-000000000001',
    providerKey: 'expeditions',
    entityKind: 'TRIP',
    title: 'Přechod Krkonoš',
    subtitle: 'Vícedenní trek · Krkonoše',
    matchedField: 'Lokalita',
    iconKey: 'mountain',
    score: 0.94,
    navigationTarget: {
      area: 'expeditions',
      screen: 'trip',
      tripId: '14000000-0000-4000-8000-000000000001',
    },
  },
} as const;

function searchResponse(query: string) {
  const normalized = query.toLocaleLowerCase('cs-CZ');
  const item = normalized.includes('dokument')
    ? fixtures.document
    : normalized.includes('lékár') || normalized.includes('lekar')
      ? fixtures.task
      : normalized.includes('rajč') || normalized.includes('rajc')
        ? fixtures.recipe
        : fixtures.trip;
  const group =
    item.providerKey === 'documents'
      ? { key: 'documents', label: 'Dokumenty' }
      : item.providerKey === 'tasks'
        ? { key: 'tasks', label: 'Úkoly a údržba' }
        : item.providerKey === 'meals'
          ? { key: 'meals', label: 'Recepty a jídlo' }
          : { key: 'expeditions', label: 'Výpravy a výbava' };
  return {
    partial: false,
    unavailableProviders: [],
    groups: [{ ...group, total: 1, items: [item] }],
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function installGlobalSearchApiMock(
  page: Page,
  role: 'OWNER' | 'VIEWER' = 'OWNER',
): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/me')) {
      await fulfillJson(route, {
        user: {
          id: userId,
          email: 'jana@example.test',
          displayName: 'Jana Nováková',
          avatarUrl: null,
        },
        activeHousehold: {
          id: '20000000-0000-4000-8000-000000000002',
          name: 'Moje domácnost',
          role,
        },
      });
      return;
    }
    if (path.endsWith('/search') && request.method() === 'POST') {
      const body = request.postDataJSON() as { query?: unknown };
      await fulfillJson(
        route,
        searchResponse(typeof body.query === 'string' ? body.query : ''),
      );
      return;
    }
    await fulfillJson(
      route,
      { statusCode: 404, code: 'NOT_FOUND', message: 'Nenalezeno.' },
      404,
    );
  });
}
