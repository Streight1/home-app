import { expect, test, type Page } from '@playwright/test';
import baseline from './visual-baseline.json' with { type: 'json' };
import {
  assertCanonicalInterFont,
  expectNoHorizontalOverflow,
  fontMetrics,
  openVisualStory as openStory,
} from './storybook-test-helpers.js';

const dashboardViewports = [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-dashboardpage--empty-dark',
  },
  {
    name: 'mobile-light',
    width: 390,
    height: 844,
    story: 'screens-dashboardpage--empty-light',
  },
  {
    name: 'tablet-dark',
    width: 768,
    height: 1024,
    story: 'screens-dashboardpage--empty-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-dashboardpage--empty-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-dashboardpage--empty-dark',
  },
] as const;

async function installLocationApiMock(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    if (path.endsWith('/locations/suggest'))
      return json({
        items: [
          {
            providerPlaceId: 'public-library-poi',
            primaryLabel: 'Městská knihovna',
            secondaryLabel: 'veřejná instituce',
            formattedAddress: 'Centrum města',
            latitude: 50.08,
            longitude: 14.42,
            placeType: 'poi',
          },
          {
            providerPlaceId: 'public-square-address',
            primaryLabel: 'Městské náměstí 1',
            secondaryLabel: 'veřejná adresa',
            formattedAddress: 'Centrum města',
            latitude: 50.081,
            longitude: 14.421,
            placeType: 'address',
          },
        ],
      });
    if (path.endsWith('/locations/places') && request.method() === 'GET')
      return json({
        items: [
          {
            id: '60000000-0000-4000-8000-000000000001',
            visibility: 'PRIVATE',
            label: 'Domov',
            formattedAddress: 'Soukromé výchozí místo',
            provider: 'MAPY',
            hasCoordinates: true,
            placeType: 'address',
          },
        ],
      });
    if (path.endsWith('/locations/places') && request.method() === 'POST')
      return json(
        {
          id: '60000000-0000-4000-8000-000000000002',
          visibility: 'PRIVATE',
          label: 'Městská knihovna',
          formattedAddress: 'Centrum města',
          provider: 'MAPY',
          hasCoordinates: true,
          placeType: 'poi',
        },
        201,
      );
    if (path.endsWith('/calendar/preferences'))
      return json({
        householdId: '70000000-0000-4000-8000-000000000001',
        userId: '10000000-0000-4000-8000-000000000001',
        defaultPlaceId: '60000000-0000-4000-8000-000000000001',
        defaultRouteMode: 'CAR_FAST_TRAFFIC',
        defaultTravelBufferMinutes: 10,
        avoidTolls: false,
        avoidHighways: false,
        compactCalendarView: 'AGENDA',
        mediumCalendarView: 'MONTH',
        expandedCalendarView: 'WEEK',
        showTravelBlocks: true,
      });
    if (path.endsWith('/travel-origin-candidates'))
      return json({
        items: [
          {
            id: '40000000-0000-4000-8000-000000000009',
            title: 'Předchozí schůzka',
            endsAt: '2030-07-18T06:30:00.000Z',
            locationLabel: 'Radnice',
          },
        ],
      });
    return json(
      { statusCode: 404, code: 'NOT_FOUND', message: 'Nenalezeno.' },
      404,
    );
  });
}

async function installTasksDashboardErrorMock(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '10000000-0000-4000-8000-000000000001',
            email: 'jana@example.test',
            displayName: 'Jana Nováková',
            avatarUrl: null,
          },
          activeHousehold: {
            id: '70000000-0000-4000-8000-000000000001',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }),
      });
      return;
    }
    if (path.endsWith('/tasks/dashboard')) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 503,
          code: 'TASKS_DASHBOARD_UNAVAILABLE',
          message: 'Úkoly se nyní nepodařilo načíst.',
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: { total: 0, ongoingTotal: 0 },
        items: [],
      }),
    });
  });
}

test('kanonický Inter font je načtený s referenční metrikou', async ({
  page,
}) => {
  await openStory(page, 'foundations-typography--default');
  const metrics = await assertCanonicalInterFont(page);
  expect(metrics.fontLoaded).toBe(true);
  expect(metrics.fontFamily).toBe(fontMetrics.family);
  expect(metrics.width).toBe(baseline.font.expectedWidthPx);
  expect(metrics.height).toBe(baseline.font.expectedHeightPx);
});

for (const viewport of dashboardViewports) {
  test(`prázdný dashboard · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`dashboard-empty-${viewport.name}.png`);
  });
}

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-bucket-list--populated-dark',
  },
  {
    name: 'tablet-dark-empty',
    width: 768,
    height: 1024,
    story: 'screens-bucket-list--empty-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-bucket-list--populated-light',
  },
] as const) {
  test(`bucket list · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Bucket list', exact: true }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`bucket-list-${viewport.name}.png`);
  });
}

test('celodenní události používají přesný inclusive rozsah', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'screens-calendar--month-light');
  await expect(page.getByText('Jednodenní celodenní událost')).toHaveCount(1);
  await expect(page.getByText('Vícedenní celodenní událost')).toHaveCount(3);
});

test('dvojklik na prázdný den otevře sdílený create dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'screens-calendar--quick-create-by-double-click');
  await page
    .getByLabel('Vytvořit událost na 29. července 2030')
    .dblclick({ position: { x: 80, y: 80 } });
  const dialog = page.getByRole('dialog', { name: 'Nová událost' });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', {
      name: 'Datum začátku: 29. července 2030',
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel('Čas začátku')).toHaveValue('09:00');
  await expect(page).toHaveScreenshot('calendar-double-click-create.png');
});

test('desktopové menu lze sbalit a brand zůstává samostatný', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStory(page, 'layouts-appshell--desktop');
  await expect(
    page.getByRole('button', { name: 'Přejít na domovskou stránku' }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sbalit hlavní menu' }).click();
  await expect(
    page.getByRole('button', { name: 'Rozbalit hlavní menu' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('app-shell-sidebar-collapsed.png');
});

test('bucket list dashboard · desktop-wide-dark', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStory(page, 'screens-bucket-list--dashboard-dark');
  await expect(
    page.getByRole('heading', { name: 'Bucket list 2026' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot(
    'bucket-list-dashboard-desktop-wide-dark.png',
  );
});

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-finance--ledger-dark',
  },
  {
    name: 'tablet-dark',
    width: 768,
    height: 1024,
    story: 'screens-finance--ledger-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-finance--ledger-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-finance--ledger-dark',
  },
] as const) {
  test(`finance ledger · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(page.getByText('Domácí účet').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`finance-ledger-${viewport.name}.png`);
  });
}

test('finance expense dialog · mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-finance--expense-dialog');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('finance-expense-dialog-mobile.png');
});

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-finance-data--import-review-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-finance-data--import-review-light',
  },
] as const) {
  test(`finance import review · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Kontrola importu' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `finance-import-review-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-finance-data--analytics-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-finance-data--analytics-light',
  },
] as const) {
  test(`finance analytics · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Výdaje podle kategorií' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Vývoj výdajů' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `finance-analytics-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-finance-budgets--budget-states-dark',
  },
  {
    name: 'tablet-dark',
    width: 768,
    height: 1024,
    story: 'screens-finance-budgets--budget-states-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-finance-budgets--budget-states-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-finance-budgets--budget-states-dark',
  },
] as const) {
  test(`finance budget states · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Domácnost', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Blíží se limitu').first()).toBeVisible();
    await expect(page.getByText('Limit překročen')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `finance-budget-states-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-finance-budgets--insights-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-finance-budgets--insights-light',
  },
] as const) {
  test(`finance spending insights · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Kam mizí peníze' }),
    ).toBeVisible();
    await expect(page.getByText('Kavárny: časté menší nákupy')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `finance-insights-${viewport.name}.png`,
    );
  });
}

test('finance budget create dialog · mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-finance-budgets--create-dialog');
  await expect(
    page.getByRole('dialog', { name: 'Nový rozpočet' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('finance-budget-create-mobile-light.png');
});

test('finance recurring candidate · mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-finance-budgets--recurring-dark');
  await expect(page.getByText('Streamovací služba')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot(
    'finance-recurring-candidate-mobile-dark.png',
  );
});

test('finance budget dashboard widget · desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'screens-finance-budgets--dashboard-light');
  await expect(
    page.getByRole('heading', { name: 'Rozpočty a zjištění' }),
  ).toBeVisible();
  await expect(page.getByText('Nová zjištění: 3')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot(
    'finance-budget-dashboard-desktop-light.png',
  );
});

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-tasks--tasks-dark',
  },
  {
    name: 'mobile-light',
    width: 390,
    height: 844,
    story: 'screens-tasks--tasks-light',
  },
  {
    name: 'tablet-dark',
    width: 768,
    height: 1024,
    story: 'screens-tasks--tasks-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-tasks--tasks-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-tasks--tasks-dark',
  },
] as const) {
  test(`úkoly s overdue a recurring úkolem · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page
        .locator('button[aria-current="page"]')
        .filter({ hasText: 'Úkoly' })
        .first(),
    ).toBeAttached();
    if (viewport.width < 768) {
      await expect(
        page
          .getByRole('navigation', { name: 'Mobilní navigace' })
          .getByRole('button', { name: 'Úkoly' }),
      ).toHaveAttribute('aria-current', 'page');
    }
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`agenda-tasks-${viewport.name}.png`);
  });
}

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-calendar--day-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-calendar--day-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-calendar--day-dark',
  },
] as const) {
  test(`denní time-grid s překryvy · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('region', { name: 'Denní časová osa' }),
    ).toBeVisible();
    await expect(page.getByText('Kontrola domácnosti')).toBeVisible();
    await expect(page.getByText('Společná schůzka')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`calendar-day-${viewport.name}.png`);
  });
}

test('týdenní time-grid na mobilu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-calendar--week-dark');
  await expect(
    page.getByRole('region', { name: 'Týdenní časová osa' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-week-mobile-dark.png');
});

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844, mode: 'day' },
  { name: 'tablet-dark', width: 768, height: 1024, mode: 'day' },
  { name: 'desktop-light', width: 1280, height: 800, mode: 'week' },
  { name: 'desktop-wide-light', width: 1440, height: 900, mode: 'week' },
] as const) {
  test(`regrese dlouhého časového bloku · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openStory(
      page,
      viewport.mode === 'day'
        ? 'screens-calendar--time-grid-regression-day'
        : 'screens-calendar--time-grid-regression-week',
    );
    const wrapper = page.locator(
      '[data-calendar-event-positioner][data-event-id="41000000-0000-4000-8000-000000000001"]',
    );
    await expect(wrapper).toHaveCSS('height', '768px');
    const geometry = await wrapper.evaluate((positioner) => {
      const surfaceElement = positioner.querySelector<HTMLElement>(
        '[data-calendar-event-surface]',
      );
      const button = surfaceElement?.querySelector<HTMLElement>('button');
      return {
        positionerHeight: positioner.getBoundingClientRect().height,
        positionerInnerHeight: positioner.clientHeight,
        surfaceHeight: surfaceElement?.getBoundingClientRect().height ?? 0,
        buttonHeight: button?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(geometry).toEqual({
      positionerHeight: 768,
      positionerInnerHeight: 768,
      surfaceHeight: 768,
      buttonHeight: 766,
    });
    const travel = page.locator(
      '[data-calendar-event-positioner][data-event-id="51000000-0000-4000-8000-000000000001"]',
    );
    const target = page.locator(
      '[data-calendar-event-positioner][data-event-id="41000000-0000-4000-8000-000000000001"]',
    );
    await expect(travel).toHaveCSS('height', '32px');
    const travelBox = await travel.boundingBox();
    const targetBox = await target.boundingBox();
    if (!travelBox || !targetBox)
      throw new Error('Time-grid travel geometry was not measurable.');
    const bufferGap = targetBox.y - (travelBox.y + travelBox.height);
    expect(bufferGap).toBeCloseTo(10.67, 1);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-time-grid-regression-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const) {
  test(`měsíční picker šablony · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--template-month-picker');
    await expect(
      page.getByRole('button', { name: 'Červenec 2030' }),
    ).toBeVisible();
    await expect(page.getByText('Po', { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-template-month-${viewport.name}.png`,
    );
  });

  test(`smazání task-linked události · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--delete-task-event-dialog');
    const dialog = page.getByRole('dialog', { name: 'Smazat událost?' });
    await expect(dialog).toContainText('Původní úkol zůstane zachovaný');
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-delete-task-event-${viewport.name}.png`,
    );
  });

  test(`diagnostika plánování · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(
      page,
      viewport.name === 'mobile'
        ? 'features-scheduling-candidatelist--diagnostics-dark'
        : 'features-scheduling-candidatelist--diagnostics-light',
    );
    await expect(page.getByText('Cestu nelze bezpečně vměstnat')).toBeVisible();
    await expect(page.getByText('06:00–08:00')).toBeVisible();
    await expect(page.getByText('20:00–22:00')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `task-scheduling-diagnostics-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844 },
  { name: 'tablet-dark', width: 768, height: 1024 },
  { name: 'desktop-light', width: 1280, height: 800 },
  { name: 'desktop-wide-dark', width: 1440, height: 900 },
] as const) {
  test(`výběrový režim barevného kalendáře · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--selection-mode');
    await expect(page.getByText('Vybráno: 2 z 4')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Zrušit výběr: Kontrola domácnosti/ }),
    ).toBeAttached();
    if (viewport.width >= 768)
      await expect(
        page.getByText('cesta přibližně 35 min', { exact: false }),
      ).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-selection-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844 },
  { name: 'desktop-dark', width: 1280, height: 800 },
] as const) {
  test(`formulář celodenní události · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--all-day-dialog');
    const dialog = page.getByRole('dialog', {
      name: 'Upravit celodenní událost',
    });
    await expect(dialog.getByLabel('Celý den')).toBeChecked();
    await expect(dialog.getByLabel('Čas začátku')).toHaveCount(0);
    await expect(dialog.getByLabel('Čas konce')).toHaveCount(0);
    await dialog
      .getByLabel('Kdy chcete na místo dorazit?')
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByLabel('Kdy chcete na místo dorazit?'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-all-day-form-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844 },
  { name: 'desktop-dark', width: 1280, height: 800 },
] as const) {
  test(`color picker události · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--create-dialog');
    const dialog = page.getByRole('dialog', { name: 'Nová událost' });
    const cyan = dialog.getByRole('radio', { name: 'Tyrkysová' });
    await cyan.scrollIntoViewIfNeeded();
    await cyan.check();
    await expect(cyan).toBeChecked();
    await expect(dialog.getByText('Náhled podbarvení události')).toHaveClass(
      /bg-calendar-cyan-surface/,
    );
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-color-picker-${viewport.name}.png`,
    );
  });
}

test('custom origin používá autocomplete', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installLocationApiMock(page);
  await openStory(page, 'screens-calendar--edit-travel-dialog');
  const dialog = page.getByRole('dialog', { name: 'Upravit událost' });
  const origin = dialog.getByLabel('Počátek cesty');
  await origin.scrollIntoViewIfNeeded();
  await origin.selectOption('CUSTOM_PLACE');
  await expect(dialog.getByLabel('Jiné místo odjezdu')).toBeVisible();
  await dialog.getByLabel('Jiné místo odjezdu').fill('Městská');
  await expect(
    page.getByRole('option', { name: /Městská knihovna/ }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-custom-origin-mobile.png');
});

test('hromadná úprava kalendáře', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'screens-calendar--bulk-edit-dialog');
  await expect(
    page.getByRole('dialog', { name: 'Upravit 2 vybraných událostí' }),
  ).toBeVisible();
  await expect(page.getByLabel('Barva')).toHaveValue('UNCHANGED');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-bulk-edit-desktop.png');
});

test('hromadné smazání kalendáře', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/calendar/events/bulk-preview', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        eventCount: 2,
        taskEventCount: 1,
        templateEventCount: 1,
      }),
    }),
  );
  await openStory(page, 'screens-calendar--bulk-delete-dialog');
  const dialog = page.getByRole('dialog', {
    name: 'Smazat vybrané události?',
  });
  await expect(dialog.getByText('Původní úkoly i šablony')).toBeVisible();
  await dialog.getByLabel('Pro potvrzení napište SMAZAT').fill('SMAZAT');
  await expect(
    dialog.getByRole('button', { name: 'Smazat vybrané' }),
  ).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-bulk-delete-mobile.png');
});

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844 },
  { name: 'desktop-light', width: 1280, height: 800 },
] as const) {
  test(`Editace události s cestou · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await installLocationApiMock(page);
    await openStory(
      page,
      viewport.name === 'desktop-light'
        ? 'screens-calendar--edit-travel-dialog-light'
        : 'screens-calendar--edit-travel-dialog',
    );
    const dialog = page.getByRole('dialog', { name: 'Upravit událost' });
    await dialog
      .getByRole('group', { name: 'Odhad cesty' })
      .scrollIntoViewIfNeeded();
    await expect(dialog.getByLabel('Počátek cesty')).toHaveValue(
      'PREVIOUS_EVENT',
    );
    const previousEvent = dialog
      .locator('label')
      .filter({ hasText: /^Předchozí událost/ })
      .locator('select');
    await expect(previousEvent).toHaveValue(
      '40000000-0000-4000-8000-000000000009',
    );
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `calendar-edit-travel-${viewport.name}.png`,
    );
  });
}

test('autocomplete zobrazuje adresu, POI a Mapy attribution', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installLocationApiMock(page);
  await openStory(page, 'screens-calendar--create-dialog');
  const input = page.getByLabel('Místo události');
  await input.fill('Městská');
  await expect(
    page.getByRole('option', { name: /Městská knihovna/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Městské náměstí/ }),
  ).toBeVisible();
  await expect(page.getByLabel('Vyhledávání poskytují Mapy.com')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-place-autocomplete-mobile.png');
});

test('nastavení zobrazuje oddělené pohledy a výchozí místo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await installLocationApiMock(page);
  await openStory(page, 'screens-calendar--calendar-preferences');
  await expect(page.getByLabel('Telefon')).toHaveValue('AGENDA');
  const tabletView = page
    .locator('label')
    .filter({ hasText: /^Tablet/ })
    .locator('select');
  await expect(tabletView).toHaveValue('MONTH');
  await expect(page.getByLabel('Desktop')).toHaveValue('WEEK');
  await expect(page.getByLabel('Výchozí místo')).toHaveValue('Domov');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('calendar-preferences-tablet-light.png');
});

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const) {
  test(`Kalendářový odhad cesty · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--travel-estimate');
    await expect(
      page.getByRole('heading', { name: 'Odhad cesty' }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('15 minut');
    await expect(
      page.getByLabel('Odhad trasy poskytují Mapy.com'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`calendar-travel-${viewport.name}.png`);
  });
}

test('prázdné úkoly na mobilu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-tasks--empty-dark');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('agenda-empty-mobile-dark.png');
});

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-calendar--month-dark',
  },
  {
    name: 'tablet-dark',
    width: 768,
    height: 1024,
    story: 'screens-calendar--month-dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-calendar--week-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-calendar--month-dark',
  },
] as const) {
  test(`sdílený kalendář · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(page.getByRole('heading', { name: 'Kalendář' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`calendar-${viewport.name}.png`);
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  test(`Calendar create dialog · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-calendar--create-dialog');
    await expect(
      page.getByRole('dialog', { name: 'Nová událost' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`calendar-create-${viewport.name}.png`);
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
] as const) {
  test(`Tasks create dialog · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-tasks--create-dialog');
    await expect(
      page.getByRole('dialog', { name: 'Rychle přidat úkol' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`agenda-create-${viewport.name}.png`);
  });
}

for (const viewport of [
  { name: 'mobile-dark', width: 390, height: 844 },
  { name: 'desktop-dark', width: 1280, height: 800 },
] as const) {
  test(`Úkol s date pickerem a presety · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await installLocationApiMock(page);
    await openStory(page, 'screens-tasks--full-create-dialog');
    const dialog = page.getByRole('dialog', { name: 'Nový úkol' });
    await dialog.getByRole('button', { name: 'Dnes' }).click();
    await dialog.getByRole('button', { name: '1 h 30 min' }).click();
    const duration = dialog.getByLabel('Předpokládaná délka v minutách');
    await duration.scrollIntoViewIfNeeded();
    await expect(duration).toHaveValue('90');
    await expect(
      dialog.getByRole('button', { name: '1 h 30 min' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveScreenshot(
      `tasks-due-presets-${viewport.name}.png`,
    );
    const picker = dialog.getByRole('button', { name: /července 2026/ });
    await picker.scrollIntoViewIfNeeded();
    await picker.click();
    await expect(
      page.getByRole('dialog', { name: 'Vyberte datum termínu' }),
    ).toBeVisible();
    await expect(
      page.getByRole('grid', { name: 'Kalendář termínu' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`tasks-due-form-${viewport.name}.png`);
  });
}

test('dashboard Úkolů rozlišuje API chybu od prázdného stavu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await installTasksDashboardErrorMock(page);
  await openStory(page, 'screens-dashboardpage--tasks-error');
  await expect(
    page.getByRole('button', { name: 'Zkusit znovu' }),
  ).toBeVisible();
  await expect(page.getByText('Nemáte žádné otevřené úkoly.')).toHaveCount(0);
  await expect(page).toHaveScreenshot('dashboard-tasks-error-desktop-dark.png');
});

for (const login of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-loginpage--mobile',
  },
  {
    name: 'mobile-light',
    width: 390,
    height: 844,
    story: 'screens-loginpage--mobile-light',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-loginpage--desktop-light',
  },
  {
    name: 'desktop-wide-dark',
    width: 1440,
    height: 900,
    story: 'screens-loginpage--desktop',
  },
] as const) {
  test(`login · ${login.name}`, async ({ page }) => {
    await page.setViewportSize(login);
    await openStory(page, login.story);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`login-${login.name}.png`);
  });
}

test('dashboard s oddělenými fixture daty', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'screens-dashboardpage--with-fixtures');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('dashboard-fixtures-expanded.png');
});

test('otevřená mobilní navigace Více s volbou motivu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'layouts-appshell--mobile');
  await page.getByRole('button', { name: 'Více oblastí' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Další oblasti' }),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Tmavý' })).toBeChecked();
  await expect(page).toHaveScreenshot('mobile-more-theme-open.png');
});

test('otevřené desktopové uživatelské menu s volbou motivu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStory(page, 'layouts-appshell--desktop');
  await page.getByRole('button', { name: /Uživatelské menu/ }).click();
  await expect(
    page.getByRole('menu', { name: 'Uživatelské menu' }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitemradio', { name: 'Tmavý' }),
  ).toHaveAttribute('data-state', 'checked');
  await expect(page).toHaveScreenshot('desktop-user-menu-theme-open.png');
});

test('samostatný theme selector', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await openStory(page, 'features-theme-themeselector--light');
  await expect(page.getByRole('radio', { name: 'Světlý' })).toBeChecked();
  await expect(page).toHaveScreenshot('theme-selector-light.png');
});

for (const viewport of [
  {
    name: 'mobile-dark',
    width: 390,
    height: 844,
    story: 'features-scheduling-candidatelist--dark',
  },
  {
    name: 'desktop-light',
    width: 1280,
    height: 800,
    story: 'features-scheduling-candidatelist--light',
  },
] as const) {
  test(`návrhy plánování úkolu · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(page.getByRole('group', { name: 'Návrhy' })).toBeVisible();
    await expect(page.getByText('Jana Nováková').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `task-scheduling-candidates-${viewport.name}.png`,
    );
  });
}

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const) {
  test(`dialog plánování úkolu · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-tasks--scheduling-dialog');
    await expect(
      page.getByRole('dialog', { name: 'Naplánovat do kalendáře' }),
    ).toBeVisible();
    await expect(page.getByLabel('Nejdříve')).toHaveValue('06:00');
    await expect(page.getByLabel('Nejpozději do')).toHaveValue('22:00');
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(
      `task-scheduling-dialog-${viewport.name}.png`,
    );
  });
}

test('otevřený dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'components-dialog--open');
  await expect(
    page.getByRole('dialog', { name: 'Upravit domácnost' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('dialog-open.png');
});

test('otevřený mobilní sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'components-sheet--open');
  await expect(page.getByRole('dialog', { name: 'Filtry' })).toBeVisible();
  await expect(page).toHaveScreenshot('sheet-open.png');
});

for (const viewport of [
  {
    name: 'mobile-empty-dark',
    width: 390,
    height: 844,
    story: 'screens-maintenance--empty-dark',
  },
  {
    name: 'desktop-plans-light',
    width: 1280,
    height: 800,
    story: 'screens-maintenance--plans-light',
  },
  {
    name: 'desktop-overview-dark',
    width: 1440,
    height: 900,
    story: 'screens-maintenance--overview-dark',
  },
] as const) {
  test(`údržba domácnosti · ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStory(page, viewport.story);
    await expect(
      page.getByRole('heading', { name: 'Údržba domácnosti' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`maintenance-${viewport.name}.png`);
  });
}

for (const scenario of [
  {
    name: 'history-desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-maintenance--history-light',
    heading: 'Historie provedení',
  },
  {
    name: 'detail-desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-maintenance--detail-light',
    heading: 'Revize kotle',
  },
  {
    name: 'create-plan-mobile-light',
    width: 390,
    height: 844,
    story: 'screens-maintenance--create-plan-dialog',
    heading: 'Nový plán údržby',
  },
  {
    name: 'complete-mobile-light',
    width: 390,
    height: 844,
    story: 'screens-maintenance--complete-occurrence-dialog',
    heading: 'Dokončit záznam údržby',
  },
  {
    name: 'skip-mobile-dark',
    width: 390,
    height: 844,
    story: 'screens-maintenance--skip-occurrence-dialog',
    heading: 'Přeskočit termín',
  },
  {
    name: 'reschedule-desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-maintenance--reschedule-occurrence-dialog',
    heading: 'Přeplánovat termín',
  },
  {
    name: 'dashboard-widget-desktop-light',
    width: 1280,
    height: 800,
    story: 'screens-maintenance--dashboard-widget-light',
    heading: 'Údržba domácnosti',
  },
] as const) {
  test(`údržba workflow · ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario);
    await openStory(page, scenario.story);
    await expect(
      page.getByRole('heading', { name: scenario.heading }).first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot(`maintenance-${scenario.name}.png`);
  });
}

test('globální Přidat nabízí plán údržby', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStory(page, 'layouts-appshell--desktop');
  await page.getByRole('button', { name: 'Přidat' }).click();
  await expect(
    page.getByRole('menuitem', { name: 'Nový plán údržby' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('maintenance-global-add-desktop.png');
});
