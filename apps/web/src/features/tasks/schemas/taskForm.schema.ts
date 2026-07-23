import { browserTimezone } from '../lib/browserTimezone.js';
import type {
  RecurrenceFrequency,
  TaskInput,
  TaskPriority,
} from '../types/task.types.js';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedToUserId: string;
  participantUserIds: string[];
  estimatedDurationMinutes: string;
  locationPlaceId: string;
  locationLabel: string;
  locationNotes: string;
  categoryId: string;
  dueDate: string;
  dueTime: string;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: string;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth: string;
  recurrenceMonthOfYear: string;
  recurrenceEndsAt: string;
  documentIds: string[];
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

export function emptyTaskFormValues(): TaskFormValues {
  return {
    title: '',
    description: '',
    priority: 'NORMAL',
    assignedToUserId: '',
    participantUserIds: [],
    estimatedDurationMinutes: '',
    locationPlaceId: '',
    locationLabel: '',
    locationNotes: '',
    categoryId: '',
    dueDate: '',
    dueTime: '',
    recurrenceFrequency: 'NONE',
    recurrenceInterval: '1',
    recurrenceDaysOfWeek: [],
    recurrenceDayOfMonth: '',
    recurrenceMonthOfYear: '',
    recurrenceEndsAt: '',
    documentIds: [],
  };
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!values.title.trim()) errors.title = 'Zadejte název úkolu.';
  if (values.title.trim().length > 200)
    errors.title = 'Název může mít nejvýše 200 znaků.';
  if (values.description.length > 5_000)
    errors.description = 'Popis může mít nejvýše 5 000 znaků.';
  if (values.participantUserIds.length === 0)
    errors.participantUserIds = 'Vyberte alespoň jednoho účastníka.';
  if (values.estimatedDurationMinutes) {
    const duration = Number(values.estimatedDurationMinutes);
    if (!Number.isInteger(duration) || duration < 5 || duration > 1_440)
      errors.estimatedDurationMinutes =
        'Délka musí být celé číslo od 5 minut do 24 hodin.';
  }
  if (values.locationLabel.length > 300)
    errors.locationLabel = 'Místo může mít nejvýše 300 znaků.';
  if (values.locationNotes.length > 1_000)
    errors.locationNotes = 'Poznámka k místu může mít nejvýše 1 000 znaků.';
  const interval = Number(values.recurrenceInterval);
  if (!Number.isInteger(interval) || interval < 1)
    errors.recurrenceInterval = 'Interval musí být celé číslo alespoň 1.';
  if (values.dueTime && !values.dueDate)
    errors.dueDate = 'Nejprve vyberte datum termínu.';
  if (values.recurrenceFrequency !== 'NONE' && !values.dueDate)
    errors.dueDate = 'Opakovaný úkol musí mít datum termínu.';
  if (
    values.recurrenceFrequency === 'WEEKLY' &&
    values.recurrenceDaysOfWeek.length === 0
  )
    errors.recurrenceDaysOfWeek = 'Vyberte alespoň jeden den.';
  const day = Number(values.recurrenceDayOfMonth);
  if (
    values.recurrenceFrequency === 'MONTHLY' &&
    (!Number.isInteger(day) || day < 1 || day > 31)
  )
    errors.recurrenceDayOfMonth = 'Zadejte den od 1 do 31.';
  const month = Number(values.recurrenceMonthOfYear);
  if (
    values.recurrenceFrequency === 'YEARLY' &&
    (!Number.isInteger(month) || month < 1 || month > 12)
  )
    errors.recurrenceMonthOfYear = 'Zadejte měsíc od 1 do 12.';
  if (
    values.recurrenceEndsAt &&
    values.dueDate &&
    values.recurrenceEndsAt.slice(0, 10) < values.dueDate
  )
    errors.recurrenceEndsAt = 'Konec opakování nesmí být před prvním termínem.';
  return errors;
}

function iso(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function timeMinutes(value: string): number | null {
  if (!value) return null;
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function taskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    assignedToUserId: values.participantUserIds[0] ?? null,
    participantUserIds: values.participantUserIds,
    estimatedDurationMinutes: values.estimatedDurationMinutes
      ? Number(values.estimatedDurationMinutes)
      : null,
    locationPlaceId: values.locationPlaceId || null,
    locationLabel: values.locationLabel.trim() || null,
    locationNotes: values.locationNotes.trim() || null,
    categoryId: values.categoryId || null,
    dueDate: values.dueDate || null,
    dueTimeMinutes: timeMinutes(values.dueTime),
    timezone: browserTimezone(),
    recurrenceFrequency: values.recurrenceFrequency,
    recurrenceInterval: Number(values.recurrenceInterval),
    recurrenceDaysOfWeek:
      values.recurrenceFrequency === 'WEEKLY'
        ? values.recurrenceDaysOfWeek
        : [],
    recurrenceDayOfMonth:
      values.recurrenceFrequency === 'MONTHLY'
        ? Number(values.recurrenceDayOfMonth)
        : null,
    recurrenceMonthOfYear:
      values.recurrenceFrequency === 'YEARLY'
        ? Number(values.recurrenceMonthOfYear)
        : null,
    recurrenceEndsAt: iso(values.recurrenceEndsAt),
    documentIds: values.documentIds,
  };
}
