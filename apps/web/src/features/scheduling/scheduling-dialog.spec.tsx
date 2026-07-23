import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceNavigationProvider } from '../../app/workspace-navigation/WorkspaceNavigationProvider.js';
import { webEnvironment } from '../../lib/config/environment.js';
import type { Task } from '../tasks/types/task.types.js';
import { TaskSchedulingDialog } from './components/TaskSchedulingDialog.js';

const task: Task = {
  id: '30000000-0000-4000-8000-000000000001',
  title: 'Společný nákup',
  description: null,
  status: 'OPEN',
  priority: 'NORMAL',
  timing: 'UPCOMING',
  assignedTo: null,
  participants: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      displayName: 'Adam',
      email: 'adam@example.test',
      avatarUrl: null,
      calendarColorToken: 'blue',
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      displayName: 'Jana',
      email: 'jana@example.test',
      avatarUrl: null,
      calendarColorToken: 'rose',
    },
  ],
  estimatedDurationMinutes: 60,
  location: {
    placeId: null,
    label: 'Obchod',
    notes: null,
    routable: false,
  },
  category: null,
  dueDate: null,
  dueTimeMinutes: null,
  dueAt: null,
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
    nextOccurrenceDate: null,
  },
  completedAt: null,
  cancelledAt: null,
  archivedAt: null,
  createdAt: '2026-07-16T10:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
  createdBy: {
    id: '10000000-0000-4000-8000-000000000001',
    displayName: 'Adam',
    email: 'adam@example.test',
    avatarUrl: null,
  },
  documents: [],
  documentCount: 0,
  calendarSchedule: null,
  completions: [],
  permissions: {
    canEdit: true,
    canComplete: true,
    canReopen: false,
    canCancel: true,
    canArchive: true,
    canSchedule: true,
    canUnschedule: false,
  },
};

const candidate = {
  startAt: '2026-07-20T14:30:00.000Z',
  endAt: '2026-07-20T15:30:00.000Z',
  status: 'FEASIBLE' as const,
  totalTravelMinutes: 35,
  warnings: [],
  candidateToken: 'signed-candidate',
  participantTravel: [
    {
      userId: task.participants[0]?.id ?? '',
      displayName: 'Adam',
      travelBeforeMinutes: 20,
      departureAt: '2026-07-20T14:00:00.000Z',
      travelAfterMinutes: null,
      warnings: [],
    },
    {
      userId: task.participants[1]?.id ?? '',
      displayName: 'Jana',
      travelBeforeMinutes: 15,
      departureAt: '2026-07-20T14:05:00.000Z',
      travelAfterMinutes: null,
      warnings: [],
    },
  ],
};

const suggestions = () =>
  new Response(
    JSON.stringify({
      task: {
        id: task.id,
        title: task.title,
        durationMinutes: 60,
        participants: task.participants.map((participant) => ({
          userId: participant.id,
          displayName: participant.displayName,
          avatarUrl: participant.avatarUrl,
        })),
      },
      candidates: [candidate],
      diagnostics: {
        summary: {
          freeIntervalsFound: 1,
          timeCandidatesGenerated: 6,
          travelCandidatesEvaluated: 6,
          feasibleCandidates: 1,
        },
        rejections: [],
        freeIntervals: [
          {
            startAt: '2026-07-20T06:00:00.000Z',
            endAt: '2026-07-20T22:00:00.000Z',
            durationMinutes: 960,
          },
        ],
        longestFreeIntervalMinutes: 960,
        effectiveWindow: {
          startAt: '2026-07-20T06:00:00.000Z',
          endAt: '2026-07-20T22:00:00.000Z',
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

const emptySuggestions = (rejections: { code: string; count: number }[] = []) =>
  new Response(
    JSON.stringify({
      task: {
        id: task.id,
        title: task.title,
        durationMinutes: 60,
        participants: task.participants.map((participant) => ({
          userId: participant.id,
          displayName: participant.displayName,
          avatarUrl: participant.avatarUrl,
        })),
      },
      candidates: [],
      diagnostics: {
        summary: {
          freeIntervalsFound: 2,
          timeCandidatesGenerated: 4,
          travelCandidatesEvaluated: 4,
          feasibleCandidates: 0,
        },
        rejections,
        freeIntervals: [
          {
            startAt: '2026-07-20T06:00:00.000Z',
            endAt: '2026-07-20T08:00:00.000Z',
            durationMinutes: 120,
          },
          {
            startAt: '2026-07-20T20:00:00.000Z',
            endAt: '2026-07-20T22:00:00.000Z',
            durationMinutes: 120,
          },
        ],
        longestFreeIntervalMinutes: 120,
        effectiveWindow: {
          startAt: '2026-07-20T06:00:00.000Z',
          endAt: '2026-07-20T22:00:00.000Z',
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

const unverifiedSuggestions = () => {
  return new Response(
    JSON.stringify({
      task: {
        id: task.id,
        title: task.title,
        durationMinutes: 60,
        participants: task.participants.map((participant) => ({
          userId: participant.id,
          displayName: participant.displayName,
          avatarUrl: participant.avatarUrl,
        })),
      },
      candidates: [
        {
          ...candidate,
          status: 'TRAVEL_NOT_VERIFIED',
          warnings: ['ROUTING_UNAVAILABLE'],
          participantTravel: [],
        },
      ],
      diagnostics: {
        summary: {
          freeIntervalsFound: 1,
          timeCandidatesGenerated: 1,
          travelCandidatesEvaluated: 1,
          feasibleCandidates: 1,
        },
        rejections: [],
        freeIntervals: [
          {
            startAt: '2026-07-20T14:30:00.000Z',
            endAt: '2026-07-20T15:30:00.000Z',
            durationMinutes: 60,
          },
        ],
        longestFreeIntervalMinutes: 60,
        effectiveWindow: {
          startAt: '2026-07-20T06:00:00.000Z',
          endAt: '2026-07-20T22:00:00.000Z',
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

const requestUrl = (input: string | URL | Request) =>
  typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/app']}>
        <WorkspaceNavigationProvider>
          <TaskSchedulingDialog task={task} open onOpenChange={onOpenChange} />
        </WorkspaceNavigationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onOpenChange;
}

describe('task scheduling dialog integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.history.replaceState(null, '', '/app');
    document.cookie = `${webEnvironment.csrfCookieName}=test-csrf`;
  });

  it('loads new proposals when the date changes after an initial search', async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((_url, options) => {
        if (options?.signal) signals.push(options.signal);
        return Promise.resolve(suggestions());
      });
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    expect(await screen.findByRole('radio')).not.toBeChecked();

    fireEvent.change(screen.getByLabelText('Datum'), {
      target: { value: '2026-07-21' },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(signals[0]?.aborted).toBe(true);
  });

  it('does not persist a proposal until the user confirms it', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(suggestions()));
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    await userEvent.click(await screen.findByRole('radio'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Vložit do kalendáře' }),
    ).toBeEnabled();
  });

  it('opens the linked calendar event while keeping the visible URL at /app', async () => {
    const eventId = '40000000-0000-4000-8000-000000000001';
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) =>
      requestUrl(url).endsWith('/confirm')
        ? Promise.resolve(
            new Response(
              JSON.stringify({
                eventId,
                startsAt: candidate.startAt,
                endsAt: candidate.endAt,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          )
        : Promise.resolve(suggestions()),
    );
    const onOpenChange = renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    await userEvent.click(await screen.findByRole('radio'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Vložit do kalendáře' }),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(window.location.pathname).toBe('/app');
    expect(window.location.search).toBe('');
    expect(JSON.stringify(window.history.state)).toContain(eventId);
  });

  it('refreshes proposals when confirmation reports a changed calendar', async () => {
    let confirmationFailed = false;
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url) => {
        if (requestUrl(url).endsWith('/confirm') && !confirmationFailed) {
          confirmationFailed = true;
          return Promise.resolve(
            new Response(
              JSON.stringify({
                statusCode: 409,
                code: 'SCHEDULING_SLOT_CHANGED',
                message:
                  'Kalendář se mezitím změnil. Nechte si navrhnout nový čas.',
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        return Promise.resolve(suggestions());
      });
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    await userEvent.click(await screen.findByRole('radio'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Vložit do kalendáře' }),
    );

    expect(
      await screen.findByText(
        'Kalendář se mezitím změnil. Nechte si navrhnout nový čas.',
      ),
    ).toBeVisible();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('considers travel by default and can retry without travel verification', async () => {
    const bodies: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
      bodies.push(typeof options?.body === 'string' ? options.body : '');
      return Promise.resolve(
        emptySuggestions([
          { code: 'NOT_ENOUGH_TIME_BEFORE_NEXT_EVENT', count: 4 },
        ]),
      );
    });
    renderDialog();
    expect(
      screen.getByRole('switch', { name: 'Zohlednit cestu' }),
    ).toBeChecked();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    expect(
      await screen.findByText('Cestu nelze bezpečně vměstnat'),
    ).toBeVisible();
    expect(JSON.parse(bodies[0] ?? '{}')).toMatchObject({
      considerTravel: true,
    });
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Zobrazit časy bez ověření cesty',
      }),
    );
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(JSON.parse(bodies[1] ?? '{}')).toMatchObject({
      considerTravel: false,
    });
  });

  it('requires explicit acknowledgement before selecting an unverified slot', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(unverifiedSuggestions()),
    );
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    const radio = await screen.findByRole('radio');
    expect(radio).toBeDisabled();
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: /Rozumím, že časově se úkol vejde/,
      }),
    );
    expect(radio).toBeEnabled();
    await userEvent.click(radio);
    expect(
      screen.getByRole('button', { name: 'Vložit do kalendáře' }),
    ).toBeEnabled();
  });

  it('can recover by searching the following day', async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
      if (typeof options?.body !== 'string')
        throw new Error('Scheduling request body must be JSON.');
      bodies.push(JSON.parse(options.body) as Record<string, unknown>);
      return Promise.resolve(
        emptySuggestions([{ code: 'NO_COMMON_AVAILABILITY', count: 1 }]),
      );
    });
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Navrhnout časy' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Hledat zítra' }),
    );
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]?.date).not.toBe(bodies[0]?.date);
  });
});
