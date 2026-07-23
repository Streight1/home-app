import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceNavigationProvider } from '../../app/workspace-navigation/WorkspaceNavigationProvider.js';
import { webEnvironment } from '../../lib/config/environment.js';
import { TaskDetailHeader } from '../tasks/components/detail/TaskDetailHeader.js';
import type { Task } from '../tasks/types/task.types.js';
import { confirmTaskSlot, unscheduleTask } from './api/schedulingApi.js';
import { SchedulingCandidateCard } from './components/SchedulingCandidateCard.js';

const task = (patch: Partial<Task> = {}): Task => ({
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
  ],
  estimatedDurationMinutes: 60,
  location: null,
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
  ...patch,
});

function header(value: Task) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <WorkspaceNavigationProvider>
        <TaskDetailHeader
          task={value}
          onEdit={() => undefined}
          onComplete={() => undefined}
          onReopen={() => undefined}
          onCancel={() => undefined}
          onArchive={() => undefined}
          onSchedule={() => undefined}
        />
      </WorkspaceNavigationProvider>
    </MemoryRouter>,
  );
}

describe('task scheduling frontend', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = `${webEnvironment.csrfCookieName}=test-csrf`;
  });

  it('offers scheduling when the task has duration and participants', () => {
    header(task());
    expect(
      screen.getByRole('button', { name: 'Naplánovat do kalendáře' }),
    ).toBeVisible();
  });

  it('asks for duration instead of pretending the task is schedulable', () => {
    header(
      task({
        estimatedDurationMinutes: null,
        permissions: {
          ...task().permissions,
          canSchedule: false,
        },
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Doplnit délku pro plánování',
      }),
    ).toBeVisible();
  });

  it('explains participant travel and warnings without auto-selecting', () => {
    const select = vi.fn();
    render(
      <SchedulingCandidateCard
        selected={false}
        onSelect={select}
        candidate={{
          startAt: '2026-07-20T14:30:00.000Z',
          endAt: '2026-07-20T15:30:00.000Z',
          status: 'FEASIBLE_WITH_WARNINGS',
          totalTravelMinutes: 20,
          warnings: ['NEXT_EVENT_LOCATION_UNKNOWN'],
          candidateToken: 'candidate',
          participantTravel: [
            {
              userId: 'user-a',
              displayName: 'Adam',
              travelBeforeMinutes: 20,
              departureAt: '2026-07-20T14:00:00.000Z',
              travelAfterMinutes: null,
              warnings: ['NEXT_EVENT_LOCATION_UNKNOWN'],
            },
            {
              userId: 'user-b',
              displayName: 'Jana',
              travelBeforeMinutes: 15,
              departureAt: '2026-07-20T14:05:00.000Z',
              travelAfterMinutes: null,
              warnings: [],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('Adam')).toBeVisible();
    expect(screen.getByText('Jana')).toBeVisible();
    expect(
      screen.getByText('• Následující událost nemá routovatelné místo.'),
    ).toBeVisible();
    expect(screen.getByRole('radio')).not.toBeChecked();
    expect(select).not.toHaveBeenCalled();
  });

  it('confirms through the dedicated endpoint with credentials and CSRF', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          eventId: '40000000-0000-4000-8000-000000000001',
          startsAt: '2026-07-20T14:30:00.000Z',
          endsAt: '2026-07-20T15:30:00.000Z',
        }),
        { status: 200 },
      ),
    );
    await confirmTaskSlot(task().id, 'signed-candidate');
    const options = fetchMock.mock.calls[0]?.[1];
    expect(options?.credentials).toBe('include');
    expect(options?.method).toBe('POST');
    expect((options?.headers as Headers).get('X-CSRF-Token')).toBe('test-csrf');
  });

  it('unscheduling removes only the calendar link endpoint', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    await unscheduleTask(task().id);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      `/tasks/${task().id}/scheduling`,
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });
});
