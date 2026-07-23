import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { Dialog } from '../../components/ui/Dialog/Dialog.js';
import { CalendarAgendaList } from '../../features/calendar/components/calendar/CalendarAgendaList.js';
import { CalendarToolbar } from '../../features/calendar/components/calendar/CalendarToolbar.js';
import { MonthCalendar } from '../../features/calendar/components/calendar/MonthCalendar.js';
import { WeekCalendar } from '../../features/calendar/components/calendar/WeekCalendar.js';
import { CalendarTimeGrid } from '../../features/calendar/components/time-grid/CalendarTimeGrid.js';
import { CalendarEventForm } from '../../features/calendar/components/forms/CalendarEventForm.js';
import { CalendarEventDeleteDialog } from '../../features/calendar/components/dialogs/CalendarEventDeleteDialog.js';
import { CalendarMonthPicker } from '../../features/calendar/components/templates/CalendarMonthPicker.js';
import type {
  CalendarEvent,
  TravelPlan,
} from '../../features/calendar/types/calendar.types.js';
import { CalendarPreferencesPanel } from '../../features/location/components/CalendarPreferencesPanel.js';
import { RouteEstimateSummary } from '../../features/location/components/RouteEstimateSummary.js';
import {
  calendarFeedFixture,
  calendarTimeGridRegressionFixture,
} from '../fixtures/calendar.fixture.js';

const referenceDate = new Date('2030-07-15T12:00:00.000Z');
const members = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    displayName: 'Jana Nováková',
    email: 'jana@example.test',
    avatarUrl: null,
    role: 'OWNER' as const,
    calendarColorToken: 'rose' as const,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    displayName: 'Petr Novák',
    email: 'petr@example.test',
    avatarUrl: null,
    role: 'MEMBER' as const,
    calendarColorToken: 'blue' as const,
  },
];

const editableEvent = {
  id: '40000000-0000-4000-8000-000000000002',
  title: 'Návštěva městské knihovny',
  description: 'Vrácení vypůjčených knih.',
  type: 'APPOINTMENT',
  status: 'ACTIVE',
  startsAt: '2030-07-18T07:00:00.000Z',
  endsAt: '2030-07-18T08:00:00.000Z',
  timezone: 'Europe/Prague',
  isAllDay: false,
  location: 'Městská knihovna',
  locationPlaceId: '60000000-0000-4000-8000-000000000001',
  locationLabel: 'Městská knihovna',
  locationNotes: 'Sraz u hlavního vstupu.',
  calculateTravel: true,
  colorToken: 'cyan',
  source: 'MANUAL',
  templateId: null,
  participants: [
    {
      role: 'ASSIGNEE',
      user: {
        id: '10000000-0000-4000-8000-000000000001',
        displayName: 'Jana Nováková',
        avatarUrl: null,
        calendarColorToken: 'rose',
      },
    },
  ],
  spansMidnight: false,
  taskLink: null,
  permissions: {
    canEdit: true,
    canCancel: true,
    canDelete: true,
    canCompleteTask: false,
  },
  visual: { colorToken: 'rose', isShared: false },
} satisfies CalendarEvent;

const taskLinkedEvent = {
  ...editableEvent,
  source: 'TASK',
  taskLink: {
    taskId: '30000000-0000-4000-8000-000000000001',
    status: 'OPEN',
  },
} satisfies CalendarEvent;

const editableTravelPlan = {
  id: '50000000-0000-4000-8000-000000000001',
  eventId: editableEvent.id,
  travelerUserId: members[0]?.id ?? '',
  originMode: 'PREVIOUS_EVENT',
  originPlaceId: null,
  previousEventId: '40000000-0000-4000-8000-000000000009',
  routeMode: 'CAR_FAST_TRAFFIC',
  avoidTolls: false,
  avoidHighways: false,
  travelBufferMinutes: 10,
  allowTravelConflict: true,
  distanceMeters: 18_400,
  durationSeconds: 2_100,
  departureAt: '2030-07-18T06:15:00.000Z',
  status: 'READY',
  conflict: {
    hasConflict: true,
    availableTransferSeconds: 1_800,
    requiredTransferSeconds: 2_700,
    missingSeconds: 900,
  },
  origin: {
    source: 'PREVIOUS_EVENT',
    eventTitle: 'Předchozí schůzka',
  },
} satisfies TravelPlan;

function EditTravelScreen() {
  return (
    <>
      <CalendarScreen />
      <Dialog
        open
        onOpenChange={() => undefined}
        title="Upravit událost"
        description="Změňte místo, účastníky a nastavení odhadu cesty."
        size="lg"
        mobileFullScreen
      >
        <CalendarEventForm
          initial={editableEvent}
          initialTravelPlan={editableTravelPlan}
          members={members}
          currentUserId={members[0]?.id ?? ''}
          loading={false}
          error={null}
          onSubmit={() => undefined}
          onCancel={() => undefined}
        />
      </Dialog>
    </>
  );
}

function CalendarScreen({
  view = 'month',
}: {
  view?: 'month' | 'week' | 'day';
}) {
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid gap-5">
        <CalendarToolbar
          date={referenceDate}
          view={view}
          canMutate
          onViewChange={() => undefined}
          onToday={() => undefined}
          onPrevious={() => undefined}
          onNext={() => undefined}
          onCreate={() => undefined}
          onTemplates={() => undefined}
        />
        {view === 'month' ? (
          <>
            <MonthCalendar
              date={referenceDate}
              selectedDate={referenceDate}
              items={calendarFeedFixture}
              onSelectDate={() => undefined}
            />
            <section className="md:hidden">
              <h2 className="mb-3 text-section-title font-semibold">
                pondělí 15. července
              </h2>
              <CalendarAgendaList
                items={calendarFeedFixture}
                date={referenceDate}
              />
            </section>
          </>
        ) : view === 'week' ? (
          <WeekCalendar
            date={referenceDate}
            items={calendarFeedFixture}
            onSelectDate={() => undefined}
          />
        ) : (
          <CalendarTimeGrid
            date={referenceDate}
            items={calendarFeedFixture}
            mode="day"
          />
        )}
      </div>
    </AppShell>
  );
}

function TimeGridRegressionScreen({ mode }: { mode: 'day' | 'week' }) {
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid gap-4">
        <h1 className="text-page-title font-semibold">Regrese časové osy</h1>
        <CalendarTimeGrid
          date={new Date('2026-07-15T12:00:00.000Z')}
          items={calendarTimeGridRegressionFixture}
          mode={mode}
        />
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Calendar',
  component: CalendarScreen,
  parameters: { route: '/app', workspace: 'calendar' },
} satisfies Meta<typeof CalendarScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MonthDark: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
};

export const MonthLight: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
};

export const WeekLight: Story = {
  args: { view: 'week' },
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
};

export const WeekDark: Story = {
  args: { view: 'week' },
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
};

export const DayDark: Story = {
  args: { view: 'day' },
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
};

export const DayLight: Story = {
  args: { view: 'day' },
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
};

export const TimeGridRegressionDay: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
  render: () => <TimeGridRegressionScreen mode="day" />,
};

export const TimeGridRegressionWeek: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
  render: () => <TimeGridRegressionScreen mode="week" />,
};

export const CreateDialog: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
  render: () => (
    <>
      <CalendarScreen />
      <Dialog
        open
        onOpenChange={() => undefined}
        title="Nová událost"
        description="Přidejte společnou událost, osobní termín nebo pracovní směnu."
        size="lg"
        mobileFullScreen
      >
        <CalendarEventForm
          initialDate="2030-07-15"
          members={members}
          currentUserId={members[0]?.id ?? ''}
          loading={false}
          error={null}
          onSubmit={() => undefined}
          onCancel={() => undefined}
        />
      </Dialog>
    </>
  ),
};

export const EditTravelDialog: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
  render: () => <EditTravelScreen />,
};

export const EditTravelDialogLight: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
  render: () => <EditTravelScreen />,
};

export const CalendarPreferences: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
  render: () => (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="mx-auto w-full max-w-5xl">
        <CalendarPreferencesPanel />
      </div>
    </AppShell>
  ),
};

export const TravelEstimate: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
  render: () => (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <section className="mx-auto grid w-full max-w-3xl gap-4">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
            Kalendář
          </p>
          <h1 className="text-page-title font-semibold">Odhad cesty</h1>
          <p className="text-text-muted">
            Veřejný syntetický cíl · Městská knihovna
          </p>
        </div>
        <RouteEstimateSummary
          plan={{
            id: '50000000-0000-4000-8000-000000000001',
            eventId: '40000000-0000-4000-8000-000000000002',
            travelerUserId: members[0]?.id ?? '',
            originMode: 'PREVIOUS_EVENT',
            originPlaceId: null,
            previousEventId: '40000000-0000-4000-8000-000000000009',
            routeMode: 'CAR_FAST_TRAFFIC',
            avoidTolls: false,
            avoidHighways: false,
            travelBufferMinutes: 10,
            allowTravelConflict: true,
            distanceMeters: 18_400,
            durationSeconds: 2_100,
            departureAt: '2030-07-15T15:15:00.000Z',
            status: 'READY',
            conflict: {
              hasConflict: true,
              availableTransferSeconds: 1_800,
              requiredTransferSeconds: 2_700,
              missingSeconds: 900,
            },
          }}
        />
      </section>
    </AppShell>
  ),
};

export const TemplateMonthPicker: Story = {
  parameters: { theme: 'light', route: '/app', workspace: 'calendar' },
  render: () => (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-lg border border-border bg-surface-raised p-5">
        <div>
          <h1 className="text-page-title font-semibold">Použít šablonu</h1>
          <p className="text-text-muted">Vyberte dny pro ranní směnu.</p>
        </div>
        <CalendarMonthPicker
          month="2030-07"
          selected={['2030-07-01', '2030-07-03', '2030-07-15']}
          onMonthChange={() => undefined}
          onSelectionChange={() => undefined}
        />
      </section>
    </AppShell>
  ),
};

export const DeleteTaskEventDialog: Story = {
  parameters: { theme: 'dark', route: '/app', workspace: 'calendar' },
  render: () => (
    <>
      <CalendarScreen view="day" />
      <CalendarEventDeleteDialog
        event={taskLinkedEvent}
        open
        pending={false}
        error={null}
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />
    </>
  ),
};
