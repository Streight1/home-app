import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardView } from '../../features/dashboard/components/DashboardView.js';
import { emptyDashboardData } from '../../features/dashboard/types/dashboard.types.js';
import { dashboardFixture } from '../fixtures/dashboard.fixture.js';
import {
  agendaAttentionFixture,
  emptyAgendaAttention,
} from '../fixtures/agenda.fixture.js';
import {
  calendarDashboardFixture,
  emptyCalendarDashboard,
} from '../fixtures/calendar.fixture.js';

const meta = {
  title: 'Screens/DashboardPage',
  component: DashboardView,
  args: {
    displayName: 'Jana Nováková',
    householdName: 'Moje domácnost',
    avatarUrl: null,
    onLogout: () => undefined,
    tasksDashboard: emptyAgendaAttention,
    calendarDashboard: emptyCalendarDashboard,
  },
} satisfies Meta<typeof DashboardView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EmptyLight: Story = {
  args: { data: emptyDashboardData },
  parameters: { theme: 'light' },
};
export const EmptyDark: Story = {
  args: { data: emptyDashboardData },
  parameters: { theme: 'dark' },
};
export const WithFixtures: Story = {
  args: {
    data: dashboardFixture,
    tasksDashboard: agendaAttentionFixture,
    calendarDashboard: calendarDashboardFixture,
  },
};

export const TasksError: Story = {
  args: { data: emptyDashboardData },
  parameters: { theme: 'dark' },
  render: () => (
    <DashboardView
      displayName="Jana Nováková"
      householdName="Moje domácnost"
      avatarUrl={null}
      data={emptyDashboardData}
      calendarDashboard={emptyCalendarDashboard}
    />
  ),
};
