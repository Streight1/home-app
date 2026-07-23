/* global document */

import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const outputDirectory = '/tmp/homeapp-agenda-review';
const user = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Jana Nováková',
  email: 'jana@example.test',
};
const task = {
  id: '20000000-0000-4000-8000-000000000002',
  title: 'Objednat revizi kotle',
  description: 'Domluvit návštěvu technika.',
  status: 'OPEN',
  priority: 'URGENT',
  timing: 'OVERDUE',
  assignedTo: user,
  category: {
    id: '30000000-0000-4000-8000-000000000003',
    name: 'Domácnost',
    colorToken: 'primary',
  },
  dueAt: '2026-07-14T16:00:00.000Z',
  isAllDay: false,
  timezone: 'Europe/Prague',
  recurrence: {
    frequency: 'YEARLY',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: 7,
    endsAt: null,
    nextOccurrenceAt: '2027-07-14T16:00:00.000Z',
  },
  completedAt: null,
  cancelledAt: null,
  archivedAt: null,
  createdAt: '2026-07-10T08:00:00.000Z',
  updatedAt: '2026-07-10T08:00:00.000Z',
  createdBy: user,
  documents: [
    {
      id: '40000000-0000-4000-8000-000000000004',
      type: 'WARRANTY',
      primaryLabel: 'Revize kotle 2025',
      canPreview: true,
    },
  ],
  documentCount: 1,
  completions: [
    {
      id: '50000000-0000-4000-8000-000000000005',
      occurrenceDueAt: '2025-07-14T16:00:00.000Z',
      completedAt: '2025-07-14T17:00:00.000Z',
      note: 'Kontrola proběhla bez závad.',
      completedBy: user,
    },
  ],
  permissions: {
    canEdit: true,
    canComplete: true,
    canReopen: false,
    canCancel: true,
    canArchive: true,
  },
};

async function installApiMock(page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(body),
      });
    if (path.endsWith('/auth/me'))
      return json({
        user: { ...user, avatarUrl: null },
        activeHousehold: {
          id: '60000000-0000-4000-8000-000000000006',
          name: 'Moje domácnost',
          role: 'OWNER',
        },
      });
    if (path.endsWith('/agenda/attention'))
      return json({
        todayCount: 0,
        overdueCount: 1,
        items: [task],
        permissions: { canComplete: true },
      });
    if (path.endsWith('/agenda/categories')) return json([task.category]);
    if (path.endsWith(`/agenda/tasks/${task.id}`)) return json(task);
    if (path.endsWith('/agenda/tasks')) {
      if (request.method() !== 'GET') return json(task, 201);
      return json({
        items: [task],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
        members: [{ ...user, role: 'OWNER' }],
      });
    }
    if (path.endsWith('/documents'))
      return json({
        items: [],
        pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 },
      });
    return json(
      { statusCode: 404, code: 'NOT_FOUND', message: 'Nenalezeno.' },
      404,
    );
  });
}

async function prepare(browser, viewport, theme) {
  const context = await browser.newContext({
    viewport,
    locale: 'cs-CZ',
    timezoneId: 'Europe/Prague',
  });
  await context.addInitScript(
    (value) => localStorage.setItem('homeapp.theme', value),
    theme,
  );
  const page = await context.newPage();
  await installApiMock(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  return { context, page };
}

async function stabilize(page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const review of [
    { name: 'mobile-dark', width: 390, height: 844, theme: 'dark' },
    { name: 'mobile-light', width: 390, height: 844, theme: 'light' },
    { name: 'tablet-dark', width: 768, height: 1024, theme: 'dark' },
    { name: 'desktop-light', width: 1280, height: 800, theme: 'light' },
    { name: 'desktop-wide-dark', width: 1440, height: 900, theme: 'dark' },
  ]) {
    const current = await prepare(
      browser,
      { width: review.width, height: review.height },
      review.theme,
    );
    await current.page.goto('http://localhost:5173/app/agenda');
    await current.page.getByRole('heading', { name: 'Agenda' }).waitFor();
    await current.page
      .locator('a:visible', { hasText: 'Objednat revizi kotle' })
      .first()
      .waitFor();
    await stabilize(current.page);
    const overflow = await current.page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    if (overflow)
      throw new Error(`Agenda ${review.name} has horizontal overflow.`);
    await current.page.screenshot({
      path: `${outputDirectory}/agenda-${review.name}.png`,
      fullPage: true,
    });
    await current.context.close();
  }

  const mobile = await prepare(browser, { width: 390, height: 844 }, 'dark');
  await mobile.page.goto('http://localhost:5173/app/agenda');
  await mobile.page.getByRole('button', { name: 'Nový úkol' }).click();
  const mobileDialog = mobile.page.getByRole('dialog', { name: 'Nový úkol' });
  await mobileDialog.waitFor();
  await stabilize(mobile.page);
  const mobileBox = await mobileDialog.boundingBox();
  if (!mobileBox || mobileBox.width < 389 || mobileBox.height < 843)
    throw new Error('Mobilní Agenda formulář není full-screen.');
  await mobile.page.screenshot({
    path: `${outputDirectory}/create-mobile-dark.png`,
  });
  await mobile.context.close();

  const desktop = await prepare(browser, { width: 1440, height: 900 }, 'light');
  await desktop.page.goto(`http://localhost:5173/app/agenda/tasks/${task.id}`);
  await desktop.page.getByText('Historie dokončení').waitFor();
  await desktop.page.getByText('Kontrola proběhla bez závad.').waitFor();
  await stabilize(desktop.page);
  await desktop.page.screenshot({
    path: `${outputDirectory}/detail-history-desktop-light.png`,
    fullPage: true,
  });
  await desktop.page.goto('http://localhost:5173/app');
  await desktop.page.getByRole('heading', { name: 'Dnešní agenda' }).waitFor();
  await desktop.page.getByText('Po termínu: 1').waitFor();
  await stabilize(desktop.page);
  await desktop.page.screenshot({
    path: `${outputDirectory}/dashboard-widget-desktop-light.png`,
  });
  await desktop.context.close();
} finally {
  await browser.close();
}

process.stdout.write(`${outputDirectory}\n`);
