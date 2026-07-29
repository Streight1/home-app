import type {
  MaintenancePriority,
  MaintenanceOccurrenceStatus,
  MaintenancePlanStatus,
  MaintenanceRecurrence,
} from '../types/maintenance.types.js';

export const maintenancePriorityLabels: Record<MaintenancePriority, string> = {
  LOW: 'Nízká',
  NORMAL: 'Běžná',
  HIGH: 'Vysoká',
  URGENT: 'Urgentní',
};

export const maintenancePlanStatusLabels: Record<
  MaintenancePlanStatus,
  string
> = {
  ACTIVE: 'Aktivní',
  PAUSED: 'Pozastavený',
  COMPLETED: 'Dokončený',
  ARCHIVED: 'Archivovaný',
};

export const maintenanceOccurrenceStatusLabels: Record<
  MaintenanceOccurrenceStatus,
  string
> = {
  SCHEDULED: 'Naplánováno',
  TASK_CREATED: 'Úkol vytvořen',
  COMPLETED: 'Dokončeno',
  SKIPPED: 'Přeskočeno',
  CANCELLED: 'Zrušeno',
};

export function localIsoDate(date = new Date()) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatMaintenanceDate(value: string | null) {
  if (!value) return 'Bez dalšího termínu';
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' }).format(
    new Date(year, month - 1, day),
  );
}

export function formatMaintenanceRecurrence(rule: MaintenanceRecurrence) {
  if (rule.frequency === 'ONCE') return 'Jednorázově';
  if (rule.frequency === 'DAILY')
    return rule.interval === 1
      ? 'Každý den'
      : `Každých ${String(rule.interval)} dní`;
  if (rule.frequency === 'WEEKLY')
    return rule.interval === 1
      ? 'Každý týden'
      : `Každé ${String(rule.interval)} týdny`;
  if (rule.frequency === 'MONTHLY')
    return rule.interval === 1
      ? 'Každý měsíc'
      : `Každé ${String(rule.interval)} měsíce`;
  if (rule.frequency === 'YEARLY') return 'Každý rok';
  return 'Ve vybraných měsících';
}

export function formatDuration(minutes: number | null) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${String(rest)} min`;
  return rest ? `${String(hours)} h ${String(rest)} min` : `${String(hours)} h`;
}
