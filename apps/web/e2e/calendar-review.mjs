/* global document */

import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const outputDirectory = '/tmp/homeapp-calendar-review';
const householdId = '60000000-0000-4000-8000-000000000006';
const jana = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Jana Nováková',
  email: 'jana@example.test',
  avatarUrl: null,
};
const petr = {
  id: '10000000-0000-4000-8000-000000000002',
  displayName: 'Petr Novák',
  email: 'petr@example.test',
  avatarUrl: null,
};
const members = [
  { ...jana, role: 'OWNER' },
  { ...petr, role: 'MEMBER' },
];
const event = {
  id: '40000000-0000-4000-8000-000000000001',
  title: 'Noční směna',
  description: 'Předání služby v 17:45.',
  type: 'WORK_SHIFT',
  status: 'ACTIVE',
  startsAt: '2026-07-15T16:00:00.000Z',
  endsAt: '2026-07-16T04:00:00.000Z',
  timezone: 'Europe/Prague',
  isAllDay: false,
  location: 'Nemocnice',
  colorToken: 'primary',
  source: 'TEMPLATE',
  templateId: '70000000-0000-4000-8000-000000000007',
  participants: [{ role: 'ASSIGNEE', user: jana }],
  spansMidnight: true,
  permissions: { canEdit: true, canCancel: true, canDelete: true },
};
const agendaTask = {
  id: '30000000-0000-4000-8000-000000000003',
  title: 'Zaplatit pojištění domácnosti',
  description: null,
  status: 'OPEN',
  priority: 'HIGH',
  timing: 'TODAY',
  assignedTo: jana,
  category: null,
  dueAt: '2026-07-15T08:00:00.000Z',
  isAllDay: false,
  timezone: 'Europe/Prague',
  recurrence: {
    frequency: 'NONE',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endsAt: null,
    nextOccurrenceAt: null,
  },
  completedAt: null,
  cancelledAt: null,
  archivedAt: null,
  createdAt: '2026-07-10T08:00:00.000Z',
  updatedAt: '2026-07-10T08:00:00.000Z',
  createdBy: jana,
  documents: [],
  documentCount: 0,
  completions: [],
  permissions: {
    canEdit: true,
    canComplete: true,
    canReopen: false,
    canCancel: true,
    canArchive: true,
  },
};
const feedItems = [
  {
    sourceType: 'CALENDAR_EVENT',
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
    status: event.status,
    eventType: event.type,
    colorToken: event.colorToken,
    isAllDay: false,
    participants: [jana],
    navigationTarget: {
      area: 'calendar',
      screen: 'detail',
      eventId: event.id,
    },
  },
  {
    sourceType: 'CALENDAR_EVENT',
    id: '40000000-0000-4000-8000-000000000002',
    title: 'Denní směna Petra',
    start: '2026-07-16T04:00:00.000Z',
    end: '2026-07-16T12:00:00.000Z',
    status: 'ACTIVE',
    eventType: 'WORK_SHIFT',
    colorToken: 'blue',
    isAllDay: false,
    participants: [petr],
    navigationTarget: {
      area: 'calendar',
      screen: 'detail',
      eventId: '40000000-0000-4000-8000-000000000002',
    },
  },
  {
    sourceType: 'AGENDA_TASK',
    id: agendaTask.id,
    title: agendaTask.title,
    start: agendaTask.dueAt,
    end: null,
    status: 'OPEN',
    priority: 'HIGH',
    isAllDay: false,
    canComplete: true,
    navigationTarget: {
      area: 'agenda',
      screen: 'detail',
      taskId: agendaTask.id,
    },
  },
];
const template = {
  id: '70000000-0000-4000-8000-000000000007',
  name: 'Noční služba',
  title: 'Noční směna',
  description: null,
  eventType: 'WORK_SHIFT',
  startLocalTime: '18:00',
  endLocalTime: '06:00',
  endDayOffset: 1,
  timezone: 'Europe/Prague',
  isAllDay: false,
  defaultLocation: 'Nemocnice',
  colorToken: 'blue',
  participantIds: [jana.id],
};

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installApiMock(page, state) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith('/auth/me'))
      return json(route, {
        user: jana,
        activeHousehold: {
          id: householdId,
          name: 'Moje domácnost',
          role: 'OWNER',
        },
      });
    if (path.endsWith('/household/members')) return json(route, members);
    if (path.endsWith('/agenda/dashboard'))
      return json(route, {
        summary: {
          openTotal: 1,
          overdueTotal: 0,
          dueTodayTotal: 1,
          upcomingTotal: 0,
        },
        items: [],
      });
    if (path.endsWith('/calendar/dashboard'))
      return json(route, {
        summary: { total: 1, ongoingTotal: 1 },
        items: [
          {
            id: event.id,
            title: event.title,
            type: event.type,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            timezone: event.timezone,
            isAllDay: false,
            colorToken: event.colorToken,
            isOngoing: true,
            spansMidnight: true,
            participants: [jana],
            navigationTarget: {
              area: 'calendar',
              screen: 'detail',
              eventId: event.id,
            },
          },
        ],
      });
    if (path.endsWith('/calendar/feed'))
      return json(route, { items: feedItems });
    if (path.endsWith('/calendar/templates'))
      return json(route, { items: [template] });
    if (path.includes('/calendar/templates/') && path.endsWith('/bulk-apply')) {
      const payload = request.postDataJSON();
      state.bulkDates = Array.isArray(payload.dates) ? payload.dates : [];
      return json(route, {
        batchId: '80000000-0000-4000-8000-000000000008',
        eventCount: state.bulkDates.length,
        events: [],
        conflicts: 0,
      });
    }
    if (path.endsWith(`/calendar/events/${event.id}`))
      return json(route, event);
    if (path.endsWith('/calendar/events') && request.method() === 'POST')
      return json(route, event, 201);
    if (path.endsWith(`/agenda/tasks/${agendaTask.id}`))
      return json(route, agendaTask);
    if (path.endsWith('/agenda/categories')) return json(route, []);
    if (path.endsWith('/agenda/tasks'))
      return json(route, {
        items: [agendaTask],
        pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        members,
      });
    return json(
      route,
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
  const state = { bulkDates: [] };
  await installApiMock(page, state);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  return { context, page, state };
}

async function stabilize(page) {
  await page.evaluate(async () => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
}

async function openCalendar(page, width) {
  await page.goto('http://localhost:5173/app');
  await page.getByRole('heading', { name: /Dobrý den/ }).waitFor();
  if (width < 768) {
    await page.getByRole('button', { name: 'Více oblastí' }).click();
    await page
      .getByRole('dialog', { name: 'Další oblasti' })
      .getByRole('button', { name: 'Kalendář' })
      .click();
  } else {
    await page
      .getByRole('navigation', {
        name: width < 1200 ? 'Tabletová navigace' : 'Hlavní navigace',
      })
      .getByRole('button', { name: 'Kalendář' })
      .click();
  }
  try {
    await page
      .getByRole('heading', { name: 'Kalendář' })
      .waitFor({ timeout: 5_000 });
  } catch {
    const text = await page.locator('body').innerText();
    throw new Error(
      `Navigace do kalendáře se nezdařila. Viditelný obsah: ${text.slice(0, 500)}`,
    );
  }
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
    await openCalendar(current.page, review.width);
    if (review.width >= 768)
      await current.page.getByLabel('Zobrazení').selectOption('week');
    else
      await current.page
        .locator('button:visible')
        .filter({ hasText: 'Noční směna' })
        .first()
        .waitFor();
    await stabilize(current.page);
    const overflow = await current.page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    if (overflow)
      throw new Error(`Kalendář ${review.name} má horizontální overflow.`);
    await current.page.screenshot({
      path: `${outputDirectory}/calendar-${review.name}.png`,
      fullPage: true,
    });
    await current.context.close();
  }

  const mobile = await prepare(browser, { width: 390, height: 844 }, 'dark');
  await openCalendar(mobile.page, 390);
  await mobile.page.getByRole('button', { name: 'Nová událost' }).click();
  const mobileDialog = mobile.page.getByRole('dialog', {
    name: 'Nová událost',
  });
  await mobileDialog.waitFor();
  const mobileBox = await mobileDialog.boundingBox();
  if (!mobileBox || mobileBox.width < 389 || mobileBox.height < 843)
    throw new Error('Mobilní formulář události není full-screen.');
  await mobile.page.screenshot({
    path: `${outputDirectory}/event-create-mobile-dark.png`,
  });
  await mobile.context.close();

  const desktop = await prepare(browser, { width: 1440, height: 900 }, 'light');
  await openCalendar(desktop.page, 1440);
  await desktop.page.getByRole('button', { name: 'Šablony' }).click();
  const templates = desktop.page.getByRole('dialog', {
    name: 'Šablony událostí a směn',
  });
  await templates.getByRole('button', { name: 'Použít' }).click();
  const days = templates.getByRole('group', {
    name: 'Dny pro hromadné vložení',
  });
  await days.getByRole('button', { name: '2', exact: true }).click();
  await days.getByRole('button', { name: '7', exact: true }).click();
  await days.getByRole('button', { name: '16', exact: true }).click();
  await templates.getByRole('button', { name: 'Vytvořit 3 událostí' }).click();
  if (desktop.state.bulkDates.length !== 3)
    throw new Error('Bulk apply neodeslal přesně tři vybrané dny.');
  await desktop.page.getByRole('button', { name: 'Zavřít' }).click();
  await desktop.page
    .getByRole('button', { name: agendaTask.title })
    .first()
    .click();
  await desktop.page.getByRole('heading', { name: agendaTask.title }).waitFor();
  await stabilize(desktop.page);
  await desktop.page.screenshot({
    path: `${outputDirectory}/agenda-feed-navigation-desktop-light.png`,
    fullPage: true,
  });
  await desktop.context.close();
} finally {
  await browser.close();
}

process.stdout.write(`${outputDirectory}\n`);
