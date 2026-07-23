import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  TaskRecord,
  TaskWriteInput,
  ListTasksInput,
} from '../domain/ports/task.repository.js';
import type { TaskCategoryColorToken } from '../domain/ports/task-category.repository.js';
import { zonedDayBounds } from '../domain/zoned-date.js';
import {
  dateOnlyDbValue,
  isoDateFromDb,
  localIsoDate,
} from '../domain/task-due-date.js';

export const taskPersonSelect = {
  id: true,
  displayName: true,
  email: true,
  avatarUrl: true,
} as const;

export const taskInclude = {
  assignedTo: { select: taskPersonSelect },
  participants: {
    include: {
      user: {
        select: {
          ...taskPersonSelect,
          householdMembers: {
            select: { householdId: true, calendarColorToken: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  createdBy: { select: taskPersonSelect },
  category: { select: { id: true, name: true, colorToken: true } },
  completions: {
    include: { completedBy: { select: taskPersonSelect } },
    orderBy: { completedAt: 'desc' },
  },
  documents: { select: { documentId: true } },
  calendarLinks: {
    where: { removedAt: null },
    select: {
      calendarEvent: { select: { id: true, startsAt: true, endsAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.TaskInclude;

type PrismaTask = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export function toTaskRecord(task: PrismaTask): TaskRecord {
  return {
    ...task,
    dueDate: isoDateFromDb(task.dueDate),
    participantUserIds: task.participants.map((item) => item.userId),
    participants: task.participants.map(({ user }) => {
      const membership = user.householdMembers.find(
        (item) => item.householdId === task.householdId,
      );
      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        calendarColorToken: membership?.calendarColorToken ?? 'violet',
      };
    }),
    category: task.category
      ? {
          ...task.category,
          colorToken: task.category.colorToken as TaskCategoryColorToken,
        }
      : null,
    recurrenceDaysOfWeek: task.recurrenceDaysOfWeek,
    documentIds: task.documents.map((link) => link.documentId),
    calendarSchedule: task.calendarLinks[0]
      ? {
          eventId: task.calendarLinks[0].calendarEvent.id,
          startsAt: task.calendarLinks[0].calendarEvent.startsAt,
          endsAt: task.calendarLinks[0].calendarEvent.endsAt,
        }
      : null,
    completions: task.completions.map((completion) => ({
      ...completion,
      occurrenceDueDate: isoDateFromDb(completion.occurrenceDueDate),
    })),
  };
}

export function taskViewWhere(input: ListTasksInput): Prisma.TaskWhereInput {
  const day = zonedDayBounds(input.now, input.timezone);
  const today = dateOnlyDbValue(localIsoDate(input.now, input.timezone));
  const view: Prisma.TaskWhereInput =
    input.view === 'today'
      ? {
          status: 'OPEN',
          OR: [
            { dueAt: { gte: day.start, lte: day.end } },
            { dueAt: null, dueDate: today },
          ],
        }
      : input.view === 'upcoming'
        ? {
            status: 'OPEN',
            OR: [
              { dueAt: { gt: day.end } },
              { dueAt: null, dueDate: { gt: today } },
            ],
          }
        : input.view === 'overdue'
          ? {
              status: 'OPEN',
              OR: [
                { dueAt: { lt: input.now } },
                { dueAt: null, dueDate: { lt: today } },
              ],
            }
          : input.view === 'completed'
            ? { status: 'COMPLETED' }
            : input.view === 'cancelled'
              ? { status: 'CANCELLED' }
              : input.view === 'archived'
                ? { status: 'ARCHIVED' }
                : { status: 'OPEN' };
  return {
    AND: [view, ...(input.status ? [{ status: input.status }] : [])],
    ...(input.dueFrom || input.dueTo
      ? {
          dueAt: {
            ...(input.dueFrom ? { gte: input.dueFrom } : {}),
            ...(input.dueTo ? { lte: input.dueTo } : {}),
          },
        }
      : {}),
  };
}

export function taskWriteData(task: Partial<TaskWriteInput>) {
  const data: Prisma.TaskUncheckedUpdateInput = {};
  for (const key of [
    'title',
    'description',
    'priority',
    'assignedToUserId',
    'estimatedDurationMinutes',
    'locationPlaceId',
    'locationLabel',
    'locationNotes',
    'categoryId',
    'dueTimeMinutes',
    'dueAt',
    'isAllDay',
    'timezone',
    'recurrenceFrequency',
    'recurrenceInterval',
    'recurrenceDaysOfWeek',
    'recurrenceDayOfMonth',
    'recurrenceMonthOfYear',
    'recurrenceEndsAt',
    'nextOccurrenceAt',
  ] as const)
    if (task[key] !== undefined) Object.assign(data, { [key]: task[key] });
  if (task.dueDate !== undefined)
    data.dueDate = task.dueDate ? dateOnlyDbValue(task.dueDate) : null;
  return data;
}
