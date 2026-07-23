import { Injectable } from '@nestjs/common';
import type { HouseholdRole } from '../../../households/household.types.js';
import type {
  TaskDocumentSummary,
  TaskRecord,
} from '../../domain/ports/task.repository.js';
import { localIsoDate } from '../../domain/task-due-date.js';

function timing(task: TaskRecord, now: Date) {
  if (task.status !== 'OPEN') return task.status;
  if (!task.dueDate) return 'UNSCHEDULED';
  const today = localIsoDate(now, task.timezone);
  if (task.dueDate < today) return 'OVERDUE';
  if (task.dueDate > today) return 'UPCOMING';
  return task.dueAt && task.dueAt < now ? 'OVERDUE' : 'TODAY';
}

@Injectable()
export class TaskResponseMapper {
  public map(
    task: TaskRecord,
    role: HouseholdRole,
    now: Date,
    documents: readonly TaskDocumentSummary[] = [],
  ) {
    const canMutate = role !== 'VIEWER';
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      timing: timing(task, now),
      assignedTo: task.participants[0] ?? task.assignedTo,
      participants: task.participants,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      location:
        task.locationPlaceId || task.locationLabel
          ? {
              placeId: task.locationPlaceId,
              label: task.locationLabel,
              notes: task.locationNotes,
              routable: Boolean(task.locationPlaceId),
            }
          : null,
      category: task.category,
      dueDate: task.dueDate,
      dueTimeMinutes: task.dueTimeMinutes,
      dueAt: task.dueAt?.toISOString() ?? null,
      isAllDay: task.isAllDay,
      timezone: task.timezone,
      recurrence: {
        frequency: task.recurrenceFrequency,
        interval: task.recurrenceInterval,
        daysOfWeek: task.recurrenceDaysOfWeek,
        dayOfMonth: task.recurrenceDayOfMonth,
        monthOfYear: task.recurrenceMonthOfYear,
        endsAt: task.recurrenceEndsAt?.toISOString() ?? null,
        nextOccurrenceAt: task.nextOccurrenceAt?.toISOString() ?? null,
      },
      completedAt: task.completedAt?.toISOString() ?? null,
      cancelledAt: task.cancelledAt?.toISOString() ?? null,
      archivedAt: task.archivedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      createdBy: task.createdBy,
      documents,
      documentCount: documents.length,
      calendarSchedule: task.calendarSchedule
        ? {
            eventId: task.calendarSchedule.eventId,
            startsAt: task.calendarSchedule.startsAt.toISOString(),
            endsAt: task.calendarSchedule.endsAt.toISOString(),
          }
        : null,
      completions: task.completions.map((completion) => ({
        id: completion.id,
        occurrenceDueDate: completion.occurrenceDueDate,
        occurrenceDueTimeMinutes: completion.occurrenceDueTimeMinutes,
        occurrenceDueAt: completion.occurrenceDueAt?.toISOString() ?? null,
        completedAt: completion.completedAt.toISOString(),
        note: completion.note,
        completedBy: completion.completedBy,
      })),
      permissions: {
        canEdit: canMutate && task.status !== 'ARCHIVED',
        canComplete: canMutate && task.status === 'OPEN',
        canReopen: canMutate && task.status === 'COMPLETED',
        canCancel: canMutate && task.status === 'OPEN',
        canArchive: canMutate && task.status !== 'ARCHIVED',
        canSchedule:
          canMutate &&
          task.calendarSchedule === null &&
          task.status === 'OPEN' &&
          task.recurrenceFrequency === 'NONE' &&
          task.estimatedDurationMinutes !== null &&
          task.participants.length > 0,
        canUnschedule: canMutate && task.calendarSchedule !== null,
      },
    };
  }
}
