import type {
  TaskDashboard,
  TaskMember,
  Task,
  TaskCategory,
} from '../../features/tasks/types/task.types.js';

const agendaMember: TaskMember = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Jana Nováková',
  email: 'jana@example.test',
  avatarUrl: null,
  calendarColorToken: 'violet',
  role: 'OWNER',
};

export const agendaMembers: TaskMember[] = [agendaMember];

const agendaCategory: TaskCategory = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Domácnost',
  colorToken: 'primary',
};

export const agendaCategories: TaskCategory[] = [agendaCategory];

const permissions = {
  canEdit: true,
  canComplete: true,
  canReopen: false,
  canCancel: true,
  canArchive: true,
  canSchedule: true,
  canUnschedule: false,
};

export const tasks: Task[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    title: 'Objednat revizi kotle',
    description: 'Domluvit návštěvu technika.',
    status: 'OPEN',
    priority: 'URGENT',
    timing: 'OVERDUE',
    assignedTo: agendaMember,
    participants: [agendaMember],
    estimatedDurationMinutes: 60,
    location: null,
    category: agendaCategory,
    dueDate: '2026-07-14',
    dueTimeMinutes: 1080,
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
      nextOccurrenceDate: null,
    },
    completedAt: null,
    cancelledAt: null,
    archivedAt: null,
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-10T08:00:00.000Z',
    createdBy: agendaMember,
    documents: [],
    documentCount: 1,
    calendarSchedule: null,
    completions: [],
    permissions,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    title: 'Vynést tříděný odpad',
    description: null,
    status: 'OPEN',
    priority: 'NORMAL',
    timing: 'TODAY',
    assignedTo: agendaMember,
    participants: [agendaMember],
    estimatedDurationMinutes: 30,
    location: null,
    category: agendaCategory,
    dueDate: '2026-07-15',
    dueTimeMinutes: 1200,
    dueAt: '2026-07-15T18:00:00.000Z',
    isAllDay: false,
    timezone: 'Europe/Prague',
    recurrence: {
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: [3],
      dayOfMonth: null,
      monthOfYear: null,
      endsAt: null,
      nextOccurrenceAt: '2026-07-22T18:00:00.000Z',
      nextOccurrenceDate: null,
    },
    completedAt: null,
    cancelledAt: null,
    archivedAt: null,
    createdAt: '2026-07-12T08:00:00.000Z',
    updatedAt: '2026-07-12T08:00:00.000Z',
    createdBy: agendaMember,
    documents: [],
    documentCount: 0,
    calendarSchedule: null,
    completions: [],
    permissions,
  },
];

export const agendaAttentionFixture: TaskDashboard = {
  summary: {
    openTotal: 2,
    dueTodayTotal: 1,
    overdueTotal: 1,
    upcomingTotal: 0,
  },
  items: tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    dueTimeMinutes: task.dueTimeMinutes,
    dueAt: task.dueAt,
    isAllDay: task.isAllDay,
    priority: task.priority,
    assignedTo: task.assignedTo,
    participants: task.participants,
    isRecurring: task.recurrence.frequency !== 'NONE',
    isOverdue: task.timing === 'OVERDUE',
    permissions: { canComplete: true },
    navigationTarget: { area: 'tasks', screen: 'detail', taskId: task.id },
  })),
};

export const emptyAgendaAttention: TaskDashboard = {
  summary: {
    openTotal: 0,
    dueTodayTotal: 0,
    overdueTotal: 0,
    upcomingTotal: 0,
  },
  items: [],
};
