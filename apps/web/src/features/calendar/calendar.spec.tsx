import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceNavigationContext } from '../../app/workspace-navigation/workspace-navigation.context.js';
import type { WorkspaceNavigationValue } from '../../app/workspace-navigation/workspace-navigation.types.js';
import { webEnvironment } from '../../lib/config/environment.js';
import { deleteCalendarEvent } from './api/calendarApi.js';
import { CalendarEventItem } from './components/calendar/CalendarEventItem.js';
import { MonthCalendar } from './components/calendar/MonthCalendar.js';
import { WeekCalendar } from './components/calendar/WeekCalendar.js';
import { DayColumn } from './components/time-grid/DayColumn.js';
import { CalendarBulkDeleteDialog } from './components/bulk/CalendarBulkDeleteDialog.js';
import { CalendarTemplateManagerDialog } from './components/templates/CalendarTemplateManagerDialog.js';
import { CalendarEventDeleteDialog } from './components/dialogs/CalendarEventDeleteDialog.js';
import { CalendarEventForm } from './components/forms/CalendarEventForm.js';
import { CalendarEventColorPicker } from './components/forms/CalendarEventColorPicker.js';
import { EventTravelFields } from './components/forms/EventTravelFields.js';
import { EventParticipantSelector } from './components/forms/EventParticipantSelector.js';
import { CalendarPage } from './pages/CalendarPage.js';
import {
  formatCalendarMonth,
  getCalendarMonthCells,
  selectedDaysLabel,
} from './lib/calendarMonth.js';
import type {
  CalendarFeedItem,
  CalendarEventInput,
  CalendarColorToken,
  CalendarTemplate,
  TravelPlanInput,
} from './types/calendar.types.js';
import { createCalendarEventDraft } from './lib/createCalendarEventDraft.js';
import {
  calendarEventDraftEnd,
  calendarEventDraftStart,
} from './lib/createCalendarEventDraft.js';
import { occursOnDate } from './lib/calendarDate.js';

function ColorPickerHarness() {
  const [value, setValue] = useState<CalendarColorToken | null>(null);
  return <CalendarEventColorPicker value={value} onChange={setValue} />;
}

function TravelFieldsHarness() {
  const [value, setValue] = useState<TravelPlanInput | null>(null);
  return (
    <EventTravelFields
      members={[
        {
          id: '20000000-0000-4000-8000-000000000002',
          email: 'jana@example.test',
          displayName: 'Jana',
          avatarUrl: null,
          role: 'MEMBER',
          calendarColorToken: 'rose',
        },
      ]}
      startsAt="2026-07-16T10:00"
      destinationPlaceId="60000000-0000-4000-8000-000000000006"
      calculateTravel
      value={value}
      onCalculateTravelChange={() => undefined}
      onChange={setValue}
    />
  );
}

const eventItem: CalendarFeedItem = {
  sourceType: 'CALENDAR_EVENT',
  id: '10000000-0000-4000-8000-000000000001',
  title: 'Noční směna',
  start: '2026-07-15T16:00:00.000Z',
  end: '2026-07-16T04:00:00.000Z',
  status: 'ACTIVE',
  eventType: 'WORK_SHIFT',
  colorToken: 'blue',
  isAllDay: false,
  participants: [
    {
      id: '20000000-0000-4000-8000-000000000002',
      displayName: 'Jana',
      avatarUrl: null,
    },
  ],
  taskLink: null,
  navigationTarget: {
    area: 'calendar',
    screen: 'detail',
    eventId: '10000000-0000-4000-8000-000000000001',
  },
};
const allDayItem: CalendarFeedItem = {
  ...eventItem,
  id: '90000000-0000-4000-8000-000000000009',
  title: 'Jeden den',
  start: '2026-07-29',
  end: '2026-07-30',
  isAllDay: true,
  eventType: 'PERSONAL',
  navigationTarget: {
    area: 'calendar',
    screen: 'detail',
    eventId: '90000000-0000-4000-8000-000000000009',
  },
};
const taskItem: CalendarFeedItem = {
  sourceType: 'TASK',
  id: '30000000-0000-4000-8000-000000000003',
  title: 'Revize kotle',
  start: '2026-07-15T10:00:00.000Z',
  end: null,
  status: 'OPEN',
  priority: 'HIGH',
  isAllDay: false,
  canComplete: true,
  navigationTarget: {
    area: 'tasks',
    screen: 'detail',
    taskId: '30000000-0000-4000-8000-000000000003',
  },
};
const travelItem: CalendarFeedItem = {
  sourceType: 'TRAVEL_BLOCK',
  id: '60000000-0000-4000-8000-000000000006',
  eventId: eventItem.id,
  title: `Cesta na ${eventItem.title}`,
  eventTitle: eventItem.title,
  start: '2026-07-15T15:15:00.000Z',
  end: '2026-07-15T15:50:00.000Z',
  eventStartsAt: eventItem.start,
  status: 'READY',
  routeMode: 'CAR_FAST_TRAFFIC',
  durationSeconds: 2_100,
  distanceMeters: 18_400,
  bufferMinutes: 10,
  hasConflict: false,
  missingSeconds: 0,
  travelerUserId: '20000000-0000-4000-8000-000000000002',
  traveler: {
    id: '20000000-0000-4000-8000-000000000002',
    displayName: 'Jana',
    avatarUrl: null,
  },
  navigationTarget: {
    area: 'calendar',
    screen: 'detail',
    eventId: '10000000-0000-4000-8000-000000000001',
  },
};
const template: CalendarTemplate = {
  id: '40000000-0000-4000-8000-000000000004',
  name: 'Ranní směna',
  title: 'Ranní směna',
  description: null,
  eventType: 'WORK_SHIFT',
  startLocalTime: '06:00',
  endLocalTime: '14:00',
  endDayOffset: 0,
  timezone: 'Europe/Prague',
  isAllDay: false,
  defaultLocation: null,
  colorToken: 'blue',
  participantIds: ['20000000-0000-4000-8000-000000000002'],
};

const taskCalendarEvent = {
  id: eventItem.id,
  title: 'Plavání',
  description: null,
  type: 'GENERAL' as const,
  status: 'ACTIVE' as const,
  startsAt: '2026-07-20T16:00:00.000Z',
  endsAt: '2026-07-20T17:00:00.000Z',
  timezone: 'Europe/Prague',
  isAllDay: false,
  location: null,
  locationPlaceId: null,
  locationLabel: null,
  locationNotes: null,
  colorToken: 'blue' as const,
  source: 'TASK' as const,
  templateId: null,
  participants: [
    {
      role: 'ASSIGNEE' as const,
      user: {
        id: '20000000-0000-4000-8000-000000000002',
        email: 'jana@example.test',
        displayName: 'Jana',
        avatarUrl: null,
      },
    },
  ],
  spansMidnight: false,
  taskLink: { taskId: taskItem.id, status: 'OPEN' as const },
  permissions: {
    canEdit: true,
    canCancel: true,
    canDelete: true,
    canCompleteTask: true,
  },
};

function response(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
function mockApi(
  items: CalendarFeedItem[] = [],
  templates: CalendarTemplate[] = [],
) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes('/calendar/feed')) return response({ items });
    if (url.includes('/calendar/preferences'))
      return response({
        householdId: '70000000-0000-4000-8000-000000000007',
        userId: '20000000-0000-4000-8000-000000000002',
        defaultPlaceId: null,
        defaultRouteMode: 'CAR_FAST_TRAFFIC',
        defaultTravelBufferMinutes: 10,
        avoidTolls: false,
        avoidHighways: false,
        compactCalendarView: 'MONTH',
        mediumCalendarView: 'MONTH',
        expandedCalendarView: 'MONTH',
        showTravelBlocks: true,
        showTravelBlocksInMonth: false,
      });
    if (url.includes('/locations/places')) return response({ items: [] });
    if (url.includes('/travel-origin-candidates'))
      return response({
        items: [
          {
            id: '80000000-0000-4000-8000-000000000008',
            title: 'Předchozí schůzka',
            endsAt: '2026-07-15T14:30:00.000Z',
            locationLabel: 'Městská knihovna',
          },
        ],
      });
    if (url.includes('/calendar/templates/') && url.includes('/bulk-apply'))
      return response({
        batchId: '50000000-0000-4000-8000-000000000005',
        eventCount: 2,
        conflicts: 0,
        events: [],
      });
    if (
      url.endsWith('/calendar/templates') &&
      (init?.method ?? 'GET') === 'GET'
    )
      return response({ items: templates });
    if (url.includes('/household/members'))
      return response([
        {
          id: '20000000-0000-4000-8000-000000000002',
          email: 'jana@example.test',
          displayName: 'Jana',
          avatarUrl: null,
          role: 'OWNER',
        },
      ]);
    if (url.includes('/tasks/tasks/') && url.endsWith('/complete'))
      return response({});
    return response({}, 404);
  });
}
function wrapper(element: ReactElement, navigate = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const workspace: WorkspaceNavigationValue = {
    view: { area: 'calendar', screen: 'calendar' },
    navigate,
    openOverlay: vi.fn(),
    closeOverlay: vi.fn(),
    clear: vi.fn(),
  };
  return {
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <WorkspaceNavigationContext.Provider value={workspace}>
            {element}
          </WorkspaceNavigationContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    navigate,
    client,
    workspace,
  };
}

describe('shared calendar frontend', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('opens the desktop calendar in Month view and keeps templates secondary', async () => {
    mockApi();
    wrapper(<CalendarPage role="MEMBER" />);
    expect(
      await screen.findByRole('region', { name: 'Měsíční kalendář' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Měsíc' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.queryByRole('dialog', { name: 'Šablony událostí a směn' }),
    ).not.toBeInTheDocument();
  });

  it('creates deterministic drafts for a day, a slot and the next half hour', () => {
    const day = createCalendarEventDraft(
      { source: 'month-day-double-click', date: '2026-07-29' },
      () => new Date(2026, 6, 29, 20, 7),
    );
    expect(day).toMatchObject({
      date: '2026-07-29',
      startTime: '09:00',
      durationMinutes: 60,
      isAllDay: false,
    });
    const slot = createCalendarEventDraft({
      source: 'time-slot-double-click',
      date: '2026-07-29',
      startTime: '08:30',
    });
    expect(calendarEventDraftStart(slot)).toBe('2026-07-29T08:30');
    expect(calendarEventDraftEnd(slot)).toBe('2026-07-29T09:30');
    const dashboard = createCalendarEventDraft(
      { source: 'dashboard' },
      () => new Date(2026, 6, 29, 20, 7),
    );
    expect(dashboard).toMatchObject({
      date: '2026-07-29',
      startTime: '20:30',
    });
  });

  it('keeps an all-day exclusive end out of the following day without UTC conversion', () => {
    expect(occursOnDate(allDayItem, new Date(2026, 6, 29))).toBe(true);
    expect(occursOnDate(allDayItem, new Date(2026, 6, 30))).toBe(false);
    const multiDay = { ...allDayItem, end: '2026-08-01' };
    expect(occursOnDate(multiDay, new Date(2026, 6, 31))).toBe(true);
    expect(occursOnDate(multiDay, new Date(2026, 7, 1))).toBe(false);
  });

  it('opens quick create on an empty month day but not on an event', () => {
    const onCreateDate = vi.fn();
    wrapper(
      <MonthCalendar
        date={new Date(2026, 6, 29)}
        selectedDate={new Date(2026, 6, 29)}
        items={[allDayItem]}
        onSelectDate={() => undefined}
        onCreateDate={onCreateDate}
      />,
    );
    fireEvent.doubleClick(
      screen.getByLabelText('Vytvořit událost na 30. července 2026'),
    );
    expect(onCreateDate).toHaveBeenCalledWith(new Date(2026, 6, 30));
    fireEvent.doubleClick(
      screen.getByRole('button', { name: /Otevřít: Jeden den/ }),
    );
    expect(onCreateDate).toHaveBeenCalledOnce();
  });

  it('opens keyboard quick create for a focused month day', () => {
    const onCreateDate = vi.fn();
    wrapper(
      <MonthCalendar
        date={new Date(2026, 6, 29)}
        selectedDate={new Date(2026, 6, 29)}
        items={[]}
        onSelectDate={() => undefined}
        onCreateDate={onCreateDate}
      />,
    );
    fireEvent.keyDown(
      screen.getByLabelText('Vytvořit událost na 29. července 2026'),
      { key: 'Enter' },
    );
    expect(onCreateDate).toHaveBeenCalledWith(new Date(2026, 6, 29));
  });

  it('maps a time-grid double click to one shared 30-minute slot', () => {
    const onCreateAt = vi.fn();
    const { container } = wrapper(
      <DayColumn
        day={new Date(2026, 6, 29)}
        items={[]}
        onCreateAt={onCreateAt}
      />,
    );
    const column = container.querySelector<HTMLElement>('[role="group"]');
    if (!column) throw new Error('Time-grid day column was not rendered.');
    vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 1536,
      left: 0,
      right: 200,
      width: 200,
      height: 1536,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    });
    fireEvent.doubleClick(column, { clientY: 544 });
    expect(onCreateAt).toHaveBeenCalledWith(new Date(2026, 6, 29), '08:30');
  });

  it('shows a selected-day agenda below the mobile month without a table', async () => {
    mockApi([eventItem]);
    wrapper(<CalendarPage role="MEMBER" />);
    await screen.findByRole('region', { name: 'Měsíční kalendář' });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', {
        level: 2,
        name: /červenec|středa|dnes/i,
      }).length,
    ).toBeGreaterThan(0);
  });

  it('renders an overnight shift as one item with a next-day marker', () => {
    wrapper(<CalendarEventItem item={eventItem} />);
    expect(screen.getByText(/\(\+1 den\)/)).toBeInTheDocument();
    expect(screen.getAllByText('Noční směna')).toHaveLength(1);
  });

  it('uses the event visual token across the complete event surface', () => {
    const colored = {
      ...eventItem,
      visual: {
        colorToken: 'rose' as const,
        isShared: false,
        kind: 'WORK_SHIFT' as const,
      },
    };
    const { container } = wrapper(<CalendarEventItem item={colored} />);
    expect(
      container.querySelector('[data-calendar-event-surface]'),
    ).toHaveClass(
      'bg-calendar-rose-surface',
      'border-calendar-rose-border',
      'text-calendar-rose-foreground',
    );
  });

  it('changes the form preview through the accessible color radio group', async () => {
    const { container } = wrapper(<ColorPickerHarness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Modrá' }));
    expect(container.querySelector('[aria-live="polite"]')).toHaveClass(
      'bg-calendar-blue-surface',
    );
  });

  it('keeps travel compact in the month view by default', () => {
    wrapper(
      <MonthCalendar
        date={new Date(2026, 6, 15)}
        selectedDate={new Date(2026, 6, 15)}
        items={[eventItem, travelItem]}
        onSelectDate={() => undefined}
      />,
    );
    expect(screen.getAllByText('🚗 cesta přibližně 35 min')).toHaveLength(1);
    expect(
      screen.queryByRole('button', {
        name: 'Cesta na Noční směna, přibližně 35 minut, Jana',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders one overnight entity as two weekly visual segments', () => {
    wrapper(
      <WeekCalendar
        date={new Date('2026-07-15T12:00:00.000Z')}
        items={[eventItem]}
        onSelectDate={() => undefined}
      />,
    );
    expect(screen.getAllByText('Noční směna')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Noční směna/ })).toHaveLength(
      2,
    );
  });

  it('opens a task through the workspace target', async () => {
    const navigate = vi.fn();
    wrapper(<CalendarEventItem item={taskItem} />, navigate);
    const taskButton = screen.getAllByRole('button', {
      name: /Revize kotle/,
    })[0];
    if (!taskButton) throw new Error('Agenda task button was not rendered');
    await userEvent.click(taskButton);
    expect(navigate).toHaveBeenCalledWith(taskItem.navigationTarget);
  });

  it('quick completion uses the Tasks endpoint and an accessible label', async () => {
    mockApi();
    wrapper(<CalendarEventItem item={taskItem} />);
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Označit úkol „Revize kotle“ jako splněný',
      }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/tasks/30000000-0000-4000-8000-000000000003/complete',
        ),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      ),
    );
  });

  it('renders a travel block as a read-only estimate linked to its event', async () => {
    const navigate = vi.fn();
    wrapper(<CalendarEventItem item={travelItem} />, navigate);
    const button = screen.getByRole('button', {
      name: 'Cesta na Noční směna, přibližně 35 minut, Jana',
    });
    expect(
      screen.getByText('Cesta na Noční směna · přibližně 35 min'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Upravit')).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(navigate).toHaveBeenCalledWith(eventItem.navigationTarget);
  });

  it('offers a previous event explicitly without selecting it automatically', async () => {
    mockApi();
    const onChange = vi.fn();
    wrapper(
      <EventTravelFields
        eventId={eventItem.id}
        members={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            email: 'jana@example.test',
            displayName: 'Jana',
            avatarUrl: null,
            role: 'MEMBER',
            calendarColorToken: 'rose',
          },
        ]}
        startsAt="2026-07-16T08:00"
        destinationPlaceId="60000000-0000-4000-8000-000000000006"
        calculateTravel
        value={{
          travelerUserId: '20000000-0000-4000-8000-000000000002',
          originMode: 'PREVIOUS_EVENT',
          previousEventId: null,
          routeMode: 'CAR_FAST_TRAFFIC',
          avoidTolls: false,
          avoidHighways: false,
          travelBufferMinutes: 10,
          allowTravelConflict: false,
        }}
        onCalculateTravelChange={() => undefined}
        onChange={onChange}
      />,
    );
    const select = await screen.findByLabelText('Předchozí událost');
    expect(select).toHaveValue('');
    expect(
      await screen.findByRole('option', { name: /Předchozí schůzka/ }),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('automatically previews travel for the selected destination and participant', async () => {
    const calls: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/calendar/preferences'))
        return response({
          defaultRouteMode: 'CAR_FAST_TRAFFIC',
          defaultTravelBufferMinutes: 10,
          avoidTolls: false,
          avoidHighways: false,
        });
      if (url.includes('/locations/places')) return response({ items: [] });
      if (url.includes('/calendar/travel-estimate')) {
        calls.push(typeof init?.body === 'string' ? init.body : '');
        return response({
          provider: 'MAPY',
          persisted: false,
          items: [
            {
              travelerUserId: '20000000-0000-4000-8000-000000000002',
              status: 'READY',
              durationSeconds: 1_441,
              distanceMeters: 18_400,
              departureAt: '2026-07-16T09:25:59.000Z',
              origin: { source: 'DEFAULT_PLACE', eventTitle: null },
              conflict: { hasConflict: false, missingSeconds: 0 },
            },
          ],
        });
      }
      return response({}, 404);
    });
    wrapper(<TravelFieldsHarness />);
    expect(
      await screen.findByText(/cesta přibližně 25 min/),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('"originMode":"AUTO"');
    expect(calls[0]).toContain('20000000-0000-4000-8000-000000000002');
  });

  it('offers day and overnight shift presets in the shared event form', async () => {
    const onSubmit = vi.fn();
    wrapper(
      <CalendarEventForm
        members={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            email: 'jana@example.test',
            displayName: 'Jana',
            avatarUrl: null,
            role: 'MEMBER',
          },
        ]}
        currentUserId="20000000-0000-4000-8000-000000000002"
        loading={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText('Typ'), 'WORK_SHIFT');
    for (const label of [
      'Denní 08:00–20:00',
      'Noční 20:00–08:00',
      'Ranní 08:00–14:00',
      'Odpolední 14:00–20:00',
    ])
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Noční 20:00–08:00' }),
    );
    expect(screen.getByLabelText<HTMLInputElement>('Čas začátku').value).toBe(
      '20:00',
    );
    expect(screen.getByLabelText<HTMLInputElement>('Čas konce').value).toBe(
      '08:00',
    );
    await userEvent.type(screen.getByLabelText('Název'), 'Noční služba');
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit událost' }),
    );
    expect(onSubmit).toHaveBeenCalledOnce();
    const input = onSubmit.mock.calls[0]?.[0] as {
      startsAt: string;
      endsAt: string;
    };
    const start = new Date(input.startsAt);
    const end = new Date(input.endsAt);
    expect(end.getTime() - start.getTime()).toBe(12 * 60 * 60_000);
  });

  it('submits an all-day event with exclusive date boundaries and no time', async () => {
    const onSubmit = vi.fn<(input: CalendarEventInput) => void>();
    wrapper(
      <CalendarEventForm
        initialDraft={createCalendarEventDraft({
          source: 'calendar-toolbar',
          date: '2026-08-10',
        })}
        members={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            email: 'jana@example.test',
            displayName: 'Jana',
            avatarUrl: null,
            role: 'MEMBER',
            calendarColorToken: 'rose',
          },
        ]}
        currentUserId="20000000-0000-4000-8000-000000000002"
        loading={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Název'), 'Výročí');
    await userEvent.click(screen.getByLabelText('Celý den'));
    expect(screen.queryByLabelText('Čas začátku')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Čas konce')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit událost' }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isAllDay: true,
        startsAt: null,
        endsAt: null,
        allDayStartDate: '2026-08-10',
        allDayEndDateExclusive: '2026-08-11',
      }),
    );
  });

  it('shows desired arrival fields for all-day travel without requiring them', () => {
    wrapper(
      <EventTravelFields
        members={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            email: 'jana@example.test',
            displayName: 'Jana',
            avatarUrl: null,
            role: 'MEMBER',
            calendarColorToken: 'rose',
          },
        ]}
        startsAt="2026-08-10T09:00"
        isAllDay
        allDayStartDate="2026-08-10"
        destinationPlaceId="60000000-0000-4000-8000-000000000006"
        calculateTravel
        value={{
          travelerUserId: '20000000-0000-4000-8000-000000000002',
          originMode: 'AUTO',
          routeMode: 'CAR_FAST_TRAFFIC',
          avoidTolls: false,
          avoidHighways: false,
          travelBufferMinutes: 10,
        }}
        onCalculateTravelChange={() => undefined}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText('Kdy chcete na místo dorazit?')).toHaveValue(
      '',
    );
    expect(
      screen.getByText('Pro výpočet cesty zadejte, kdy chcete dorazit.'),
    ).toBeInTheDocument();
  });

  it('requires the explicit SMAZAT confirmation for bulk delete', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/calendar/events/bulk-preview'))
        return response({
          eventCount: 1,
          taskEventCount: 1,
          templateEventCount: 0,
        });
      return response({});
    });
    wrapper(
      <CalendarBulkDeleteDialog
        open
        eventIds={[eventItem.id]}
        onOpenChange={() => undefined}
        onDeleted={() => undefined}
      />,
    );
    const submit = screen.getByRole('button', { name: 'Smazat vybrané' });
    expect(submit).toBeDisabled();
    await screen.findByText('1', { selector: 'dd' });
    await userEvent.type(
      screen.getByLabelText('Pro potvrzení napište SMAZAT'),
      'SMAZAT',
    );
    expect(submit).toBeEnabled();
  });

  it('lets a normal event select several members and a shift exactly one', () => {
    const members = [
      {
        id: '20000000-0000-4000-8000-000000000002',
        email: 'jana@example.test',
        displayName: 'Jana',
        avatarUrl: null,
        role: 'MEMBER' as const,
        calendarColorToken: 'rose' as const,
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        email: 'adam@example.test',
        displayName: 'Adam',
        avatarUrl: null,
        role: 'OWNER' as const,
        calendarColorToken: 'blue' as const,
      },
    ];
    const toggle = vi.fn();
    const { rerender } = wrapper(
      <EventParticipantSelector
        type="GENERAL"
        members={members}
        selected={members.map(({ id }) => id)}
        onToggle={toggle}
      />,
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EventParticipantSelector
            type="WORK_SHIFT"
            members={members}
            selected={[members[0]?.id ?? '']}
            onToggle={toggle}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('bulk template application selects several days and shows the batch preview count', async () => {
    mockApi([], [template]);
    wrapper(
      <CalendarTemplateManagerDialog open onOpenChange={() => undefined} />,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Použít' }),
    );
    const group = screen.getByRole('group', {
      name: 'Dny pro hromadné vložení',
    });
    await userEvent.click(within(group).getByRole('button', { name: '1' }));
    await userEvent.click(within(group).getByRole('button', { name: '3' }));
    expect(screen.getByText('Vybráno: 2 dny')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Vytvořit 2 událostí' }),
    ).toBeEnabled();
  });

  it('uses a Monday-first localized month grid and Czech day inflection', () => {
    expect(formatCalendarMonth('2026-07')).toBe('Červenec 2026');
    const cells = getCalendarMonthCells('2026-07');
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({
      isoDate: '2026-06-29',
      day: 29,
      inMonth: false,
    });
    expect(cells[2]).toEqual({
      isoDate: '2026-07-01',
      day: 1,
      inMonth: true,
    });
    expect(selectedDaysLabel(1)).toBe('1 den');
    expect(selectedDaysLabel(4)).toBe('4 dny');
    expect(selectedDaysLabel(5)).toBe('5 dní');
  });

  it('explains that deleting a task-linked event preserves its task', () => {
    wrapper(
      <CalendarEventDeleteDialog
        event={taskCalendarEvent}
        open
        pending={false}
        error={null}
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: 'Smazat událost?' }),
    ).toBeVisible();
    expect(
      screen.getByText(/Původní úkol zůstane zachovaný/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Smazat událost' }),
    ).toBeEnabled();
    expect(screen.getByText(/20\. 7\. 2026 18:00.*19:00/)).toBeInTheDocument();
    expect(screen.queryByText(/18:00:00/)).not.toBeInTheDocument();
  });

  it('deletes an event through the authenticated CSRF-protected endpoint', async () => {
    document.cookie = `${webEnvironment.csrfCookieName}=calendar-delete-csrf`;
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await deleteCalendarEvent(eventItem.id);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/calendar/events/${eventItem.id}`),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('X-CSRF-Token')).toBe(
      'calendar-delete-csrf',
    );
  });

  it('viewer can read the calendar but does not see mutation actions', async () => {
    mockApi();
    wrapper(<CalendarPage role="VIEWER" />);
    await screen.findByRole('region', { name: 'Měsíční kalendář' });
    expect(
      screen.queryByRole('button', { name: 'Nová událost' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Šablony' }),
    ).not.toBeInTheDocument();
  });
});
