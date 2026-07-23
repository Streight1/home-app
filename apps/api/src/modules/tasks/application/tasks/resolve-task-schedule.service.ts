import { Injectable } from '@nestjs/common';
import {
  dueInstant,
  isIsoDate,
  localIsoDate,
} from '../../domain/task-due-date.js';
import { invalidTaskInput } from '../../domain/task.errors.js';
import type {
  TaskRecord,
  TaskWriteInput,
} from '../../domain/ports/task.repository.js';
import type { RecurrenceRule } from '../../domain/recurrence-rule.js';
import type { CreateTaskDto } from '../../presentation/dto/create-task.dto.js';
import type { UpdateTaskDto } from '../../presentation/dto/update-task.dto.js';
import { ValidateRecurrenceService } from '../recurrence/validate-recurrence.service.js';

type TaskInput = CreateTaskDto | UpdateTaskDto;
type TaskSchedule = Pick<
  TaskWriteInput,
  | 'dueDate'
  | 'dueTimeMinutes'
  | 'dueAt'
  | 'isAllDay'
  | 'timezone'
  | 'recurrenceFrequency'
  | 'recurrenceInterval'
  | 'recurrenceDaysOfWeek'
  | 'recurrenceDayOfMonth'
  | 'recurrenceMonthOfYear'
  | 'recurrenceEndsAt'
  | 'nextOccurrenceAt'
>;

function parsed(value: string | null | undefined): Date | null | undefined {
  return value === undefined
    ? undefined
    : value === null
      ? null
      : new Date(value);
}

function recurrenceRule(
  input: TaskInput,
  existing?: TaskRecord,
): RecurrenceRule {
  const frequency =
    input.recurrenceFrequency ?? existing?.recurrenceFrequency ?? 'NONE';
  return {
    frequency,
    interval: input.recurrenceInterval ?? existing?.recurrenceInterval ?? 1,
    daysOfWeek:
      frequency === 'WEEKLY'
        ? (input.recurrenceDaysOfWeek ?? existing?.recurrenceDaysOfWeek ?? [])
        : [],
    dayOfMonth:
      frequency === 'MONTHLY'
        ? (input.recurrenceDayOfMonth ?? existing?.recurrenceDayOfMonth ?? null)
        : null,
    monthOfYear:
      frequency === 'YEARLY'
        ? (input.recurrenceMonthOfYear ??
          existing?.recurrenceMonthOfYear ??
          null)
        : null,
    endsAt:
      input.recurrenceEndsAt !== undefined
        ? (parsed(input.recurrenceEndsAt) ?? null)
        : (existing?.recurrenceEndsAt ?? null),
  };
}

@Injectable()
export class ResolveTaskScheduleService {
  public constructor(private readonly recurrence: ValidateRecurrenceService) {}

  public execute(input: TaskInput, existing?: TaskRecord): TaskSchedule {
    const timezone = input.timezone ?? existing?.timezone ?? 'Europe/Prague';
    const dueDate =
      input.dueDate !== undefined ? input.dueDate : (existing?.dueDate ?? null);
    if (dueDate !== null && !isIsoDate(dueDate))
      throw invalidTaskInput('Datum termínu není platné ISO datum.');
    const requestedTime =
      input.dueTimeMinutes !== undefined
        ? input.dueTimeMinutes
        : (existing?.dueTimeMinutes ?? null);
    if (
      dueDate === null &&
      input.dueTimeMinutes !== undefined &&
      input.dueTimeMinutes !== null
    )
      throw invalidTaskInput('Čas termínu vyžaduje také datum.');
    const dueTimeMinutes = dueDate === null ? null : requestedTime;
    if (
      dueTimeMinutes !== null &&
      (!Number.isInteger(dueTimeMinutes) ||
        dueTimeMinutes < 0 ||
        dueTimeMinutes > 1_439)
    )
      throw invalidTaskInput('Čas termínu musí být v rozsahu jednoho dne.');
    const dueAt =
      dueDate !== null && dueTimeMinutes !== null
        ? dueInstant(dueDate, dueTimeMinutes, timezone)
        : null;
    if (dueDate !== null && dueTimeMinutes !== null && dueAt === null)
      throw invalidTaskInput(
        'Zvolený místní čas v tomto časovém pásmu neexistuje.',
      );
    const rule = recurrenceRule(input, existing);
    this.recurrence.execute({ dueDate, timezone, rule });
    if (rule.endsAt && dueDate && localIsoDate(rule.endsAt, timezone) < dueDate)
      throw invalidTaskInput('Konec opakování nesmí být před prvním termínem.');
    return {
      dueDate,
      dueTimeMinutes,
      dueAt,
      isAllDay: dueDate !== null && dueTimeMinutes === null,
      timezone,
      recurrenceFrequency: rule.frequency,
      recurrenceInterval: rule.interval,
      recurrenceDaysOfWeek: [...rule.daysOfWeek],
      recurrenceDayOfMonth: rule.dayOfMonth,
      recurrenceMonthOfYear: rule.monthOfYear,
      recurrenceEndsAt: rule.endsAt,
      nextOccurrenceAt: rule.frequency === 'NONE' ? null : dueAt,
    };
  }
}
