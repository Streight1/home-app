import { CalendarClock, MapPin, Pause, Play, UserRound } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import {
  formatDuration,
  formatMaintenanceDate,
  formatMaintenanceRecurrence,
  maintenancePlanStatusLabels,
  maintenancePriorityLabels,
} from '../../lib/maintenanceFormat.js';
import type { MaintenancePlan } from '../../types/maintenance.types.js';

export function MaintenancePlanCard({
  plan,
  busy,
  onOpen,
  onTransition,
}: {
  plan: MaintenancePlan;
  busy: boolean;
  onOpen: () => void;
  onTransition: (action: 'pause' | 'resume' | 'archive') => void;
}) {
  const duration = formatDuration(plan.estimatedDurationMinutes);
  return (
    <article className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={plan.overdue ? 'warning' : 'neutral'}>
              {plan.overdue
                ? 'Po termínu'
                : maintenancePriorityLabels[plan.priority]}
            </Badge>
            {plan.status !== 'ACTIVE' ? (
              <Badge>{maintenancePlanStatusLabels[plan.status]}</Badge>
            ) : null}
          </div>
          <button
            type="button"
            className="mt-2 text-left text-section-title font-semibold focus-visible:outline-2 focus-visible:outline-focus"
            onClick={onOpen}
          >
            {plan.title}
          </button>
          <p className="mt-1 text-body-sm text-text-muted">
            {plan.category?.name ?? 'Bez kategorie'} ·{' '}
            {formatMaintenanceRecurrence(plan.recurrence)}
          </p>
        </div>
        <div className="flex gap-2">
          {plan.permissions.canEdit && plan.status === 'ACTIVE' ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onTransition('pause')}
            >
              <Pause className="size-4" aria-hidden="true" />
              Pozastavit
            </Button>
          ) : null}
          {plan.permissions.canEdit &&
          (plan.status === 'PAUSED' || plan.status === 'COMPLETED') ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onTransition('resume')}
            >
              <Play className="size-4" aria-hidden="true" />
              Obnovit
            </Button>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-body-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarClock
            className="size-4 text-text-muted"
            aria-hidden="true"
          />
          <dt className="sr-only">Další termín</dt>
          <dd className={plan.overdue ? 'font-semibold text-danger' : ''}>
            {formatMaintenanceDate(plan.nextDueOn)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-text-muted" aria-hidden="true" />
          <dt className="sr-only">Odpovědná osoba</dt>
          <dd>{plan.responsible?.displayName ?? 'Celá domácnost'}</dd>
        </div>
        {plan.locationLabel ? (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-text-muted" aria-hidden="true" />
            <dt className="sr-only">Místo</dt>
            <dd className="min-w-0 truncate">{plan.locationLabel}</dd>
          </div>
        ) : null}
        {duration ? (
          <div>
            <dt className="sr-only">Odhad délky</dt>
            <dd>{duration}</dd>
          </div>
        ) : null}
      </dl>
      {plan.permissions.canArchive && plan.status !== 'ARCHIVED' ? (
        <div className="mt-3 border-t border-border pt-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onTransition('archive')}
          >
            Archivovat
          </Button>
        </div>
      ) : null}
    </article>
  );
}
