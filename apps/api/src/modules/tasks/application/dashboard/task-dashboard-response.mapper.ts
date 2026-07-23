import { Injectable } from '@nestjs/common';
import type { HouseholdRole } from '../../../households/household.types.js';
import type { TaskRecord } from '../../domain/ports/task.repository.js';
import { localIsoDate } from '../../domain/task-due-date.js';

@Injectable()
export class TaskDashboardResponseMapper {
  public map(task: TaskRecord, role: HouseholdRole, now: Date) {
    const today = localIsoDate(now, task.timezone);
    return {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      dueTimeMinutes: task.dueTimeMinutes,
      dueAt: task.dueAt?.toISOString() ?? null,
      isAllDay: task.isAllDay,
      priority: task.priority,
      assignedTo: task.participants[0] ?? task.assignedTo,
      participants: task.participants,
      isRecurring: task.recurrenceFrequency !== 'NONE',
      isOverdue: Boolean(
        task.dueDate &&
        (task.dueDate < today ||
          (task.dueDate === today && task.dueAt && task.dueAt < now)),
      ),
      permissions: { canComplete: role !== 'VIEWER' },
      navigationTarget: { area: 'tasks', screen: 'detail', taskId: task.id },
    } as const;
  }
}
