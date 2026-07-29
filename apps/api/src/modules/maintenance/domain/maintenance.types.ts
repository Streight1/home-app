export const MAINTENANCE_READ_ROLE = 'VIEWER' as const;
export const MAINTENANCE_WRITE_ROLE = 'MEMBER' as const;
export const MAINTENANCE_ADMIN_ROLE = 'ADMIN' as const;

export const MAINTENANCE_PLAN_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
] as const;
export const MAINTENANCE_OCCURRENCE_STATUSES = [
  'SCHEDULED',
  'TASK_CREATED',
  'COMPLETED',
  'SKIPPED',
  'CANCELLED',
] as const;
export const MAINTENANCE_PRIORITIES = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
] as const;
export const MAINTENANCE_COLOR_TOKENS = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'pink',
] as const;
export const MAINTENANCE_ICON_KEYS = [
  'wrench',
  'flame',
  'zap',
  'droplets',
  'wind',
  'sun',
  'trees',
  'washing-machine',
  'shield-check',
  'sparkles',
  'database-backup',
  'circle-ellipsis',
] as const;

export type MaintenancePlanStatus = (typeof MAINTENANCE_PLAN_STATUSES)[number];
export type MaintenanceOccurrenceStatus =
  (typeof MAINTENANCE_OCCURRENCE_STATUSES)[number];
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export function maintenanceDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function maintenanceDateString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function normalizeMaintenanceName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');
}
