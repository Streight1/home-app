import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { WorkspaceNavigationProvider } from '../../../../app/workspace-navigation/WorkspaceNavigationProvider.js';
import type { EventCalendarItem } from '../../types/calendar.types.js';
import { CalendarEventBlock } from './CalendarEventBlock.js';
import type { PositionedEventSegment } from './time-grid.types.js';

const item: EventCalendarItem = {
  sourceType: 'CALENDAR_EVENT',
  id: '30000000-0000-4000-8000-000000000003',
  title: 'Denní služba – VetPark',
  start: '2026-07-22T08:00:00.000Z',
  end: '2026-07-22T20:00:00.000Z',
  status: 'ACTIVE',
  eventType: 'WORK_SHIFT',
  colorToken: 'rose',
  isAllDay: false,
  participants: [],
  taskLink: null,
  navigationTarget: {
    area: 'calendar',
    screen: 'detail',
    eventId: '30000000-0000-4000-8000-000000000003',
  },
};

function segment(patch: Partial<PositionedEventSegment> = {}) {
  return {
    key: 'shift',
    item,
    startAt: new Date(item.start),
    endAt: new Date(item.end),
    startMinute: 8 * 60,
    endMinute: 20 * 60,
    continuesBefore: false,
    continuesAfter: false,
    columnIndex: 0,
    columnCount: 1,
    leftPercentage: 0,
    widthPercentage: 100,
    ...patch,
  } satisfies PositionedEventSegment;
}

function renderBlock(value = segment()) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/app']}>
        <WorkspaceNavigationProvider>
          <CalendarEventBlock segment={value} />
        </WorkspaceNavigationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CalendarEventBlock geometry regression', () => {
  it('fills the complete 08:00–20:00 positioning wrapper', () => {
    const { container } = renderBlock();
    const positioner = container.querySelector<HTMLElement>(
      '[data-calendar-event-positioner]',
    );
    const surface = container.querySelector<HTMLElement>(
      '[data-calendar-event-surface]',
    );
    expect(positioner?.style.top).toBe('512px');
    expect(positioner?.style.height).toBe('768px');
    expect(surface).toHaveClass('h-full', 'w-full');
    expect(screen.getByRole('button', { name: /Denní služba/ })).toHaveClass(
      'h-full',
    );
  });

  it('retains the segment height when overlap changes its column', () => {
    const { container } = renderBlock(
      segment({
        columnIndex: 1,
        columnCount: 2,
        leftPercentage: 50,
        widthPercentage: 50,
      }),
    );
    const positioner = container.querySelector<HTMLElement>(
      '[data-calendar-event-positioner]',
    );
    expect(positioner?.style.height).toBe('768px');
    expect(positioner?.style.left).toContain('50%');
  });
});
