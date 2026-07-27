import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  CalendarEventRecord,
  CalendarTemplateRecord,
} from '../domain/calendar.types.js';
import { calendarColorTokens } from '../domain/calendar.types.js';

function toDateOnly(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function toCalendarColorToken(value: string | null) {
  return value &&
    calendarColorTokens.includes(value as (typeof calendarColorTokens)[number])
    ? (value as CalendarEventRecord['colorToken'])
    : null;
}

export const calendarEventInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          householdMembers: {
            select: { householdId: true, calendarColorToken: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  taskLinks: {
    where: { removedAt: null },
    select: { task: { select: { id: true, status: true } } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.CalendarEventInclude;

export type CalendarEventEntity = Prisma.CalendarEventGetPayload<{
  include: typeof calendarEventInclude;
}>;

export function toCalendarEventRecord(
  event: CalendarEventEntity,
): CalendarEventRecord {
  return {
    id: event.id,
    householdId: event.householdId,
    title: event.title,
    description: event.description,
    type: event.type,
    status: event.status,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDayStartDate: toDateOnly(event.allDayStartDate),
    allDayEndDateExclusive: toDateOnly(event.allDayEndDateExclusive),
    desiredArrivalAt: event.desiredArrivalAt,
    timezone: event.timezone,
    isAllDay: event.isAllDay,
    location: event.location,
    locationPlaceId: event.locationPlaceId,
    locationLabel: event.locationLabel,
    locationNotes: event.locationNotes,
    calculateTravel: event.calculateTravel,
    colorToken: toCalendarColorToken(event.colorToken),
    source: event.source,
    templateId: event.templateId,
    templateApplicationBatchId: event.templateApplicationBatchId,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    participants: event.participants.map(({ role, user }) => ({
      role,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        calendarColorToken: (user.householdMembers.find(
          ({ householdId }) => householdId === event.householdId,
        )?.calendarColorToken ??
          'violet') as CalendarEventRecord['participants'][number]['user']['calendarColorToken'],
      },
    })),
    taskLink: event.taskLinks[0]
      ? {
          taskId: event.taskLinks[0].task.id,
          status: event.taskLinks[0].task.status,
        }
      : null,
  };
}

export const calendarTemplateInclude = {
  participants: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.CalendarTemplateInclude;

export type CalendarTemplateEntity = Prisma.CalendarTemplateGetPayload<{
  include: typeof calendarTemplateInclude;
}>;

export function toCalendarTemplateRecord(
  template: CalendarTemplateEntity,
): CalendarTemplateRecord {
  return {
    id: template.id,
    householdId: template.householdId,
    name: template.name,
    title: template.title,
    description: template.description,
    eventType: template.eventType,
    startLocalTime: template.startLocalTime,
    endLocalTime: template.endLocalTime,
    endDayOffset: template.endDayOffset,
    timezone: template.timezone,
    isAllDay: template.isAllDay,
    defaultLocation: template.defaultLocation,
    locationPlaceId: template.locationPlaceId,
    locationLabel: template.locationLabel,
    calculateTravel: template.calculateTravel,
    routeMode: template.routeMode,
    travelBufferMinutes: template.travelBufferMinutes,
    colorToken: template.colorToken as CalendarTemplateRecord['colorToken'],
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    participants: template.participants.map(({ userId, role }) => ({
      userId,
      role,
    })),
  };
}
