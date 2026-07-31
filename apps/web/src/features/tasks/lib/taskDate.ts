import type { Task } from '../types/task.types.js';
import { dateOnlyToLocalDate } from '../../../lib/date/dateOnly.js';

export function formatTaskDue(
  task: Pick<Task, 'dueDate' | 'dueTimeMinutes' | 'timing'>,
): string {
  if (!task.dueDate) return 'Bez termínu';
  const date = dateOnlyToLocalDate(task.dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (left: Date, right: Date) =>
    left.toDateString() === right.toDateString();
  const time =
    task.dueTimeMinutes === null
      ? ''
      : ` v ${String(Math.floor(task.dueTimeMinutes / 60)).padStart(2, '0')}:${String(task.dueTimeMinutes % 60).padStart(2, '0')}`;
  if (task.timing === 'OVERDUE') {
    const days = Math.max(
      1,
      Math.floor((today.getTime() - date.getTime()) / 86_400_000),
    );
    return `Po termínu o ${String(days)} ${days === 1 ? 'den' : 'dny'}`;
  }
  if (sameDay(date, today)) return `Dnes${time}`;
  if (sameDay(date, tomorrow)) return `Zítra${time}`;
  return (
    date.toLocaleDateString('cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }) + time
  );
}

export const priorityLabels = {
  LOW: 'Nízká',
  NORMAL: 'Normální',
  HIGH: 'Vysoká',
  URGENT: 'Urgentní',
} as const;
