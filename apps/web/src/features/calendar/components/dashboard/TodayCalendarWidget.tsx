import { CalendarDays, Clock3, MapPin, Navigation, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import {
  useCalendarDashboard,
  useCalendarMutations,
} from '../../hooks/useCalendar.js';
import type { CalendarDashboard } from '../../types/calendar.types.js';

export function TodayCalendarWidget({
  initialData,
}: {
  initialData?: CalendarDashboard;
}) {
  const workspace = useWorkspaceNavigation();
  const query = useCalendarDashboard(initialData);
  const { recalculateTravel } = useCalendarMutations();
  return (
    <Card className="p-5 md:col-span-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
            Dnes
          </p>
          <h2 className="mt-1 text-section-title font-semibold">Kalendář</h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            workspace.navigate({ area: 'calendar', screen: 'calendar' })
          }
        >
          Zobrazit kalendář
        </Button>
      </div>
      {query.isLoading ? (
        <div className="grid min-h-24 place-items-center">
          <Spinner />
        </div>
      ) : null}
      {query.isError ? (
        <InlineAlert variant="danger">
          Dnešní události se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      {query.data?.items.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-border p-5 text-center">
          <CalendarDays
            className="mx-auto size-6 text-text-muted"
            aria-hidden="true"
          />
          <p className="mt-2 font-medium">Dnes nemáte žádnou událost.</p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => workspace.openOverlay({ kind: 'calendar-create' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Přidat událost
          </Button>
        </div>
      ) : null}
      {query.data?.items.length ? (
        <div className="mt-4 grid gap-2">
          {query.data.items.map((item) => (
            <div
              key={item.id}
              className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md border border-border bg-surface-subtle p-3 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Clock3
                className="size-4 shrink-0 text-primary-emphasis"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => workspace.navigate(item.navigationTarget)}
                className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className="block truncate font-medium">{item.title}</span>
                <span className="text-caption text-text-muted">
                  {item.isAllDay
                    ? 'Celý den'
                    : new Date(item.startsAt).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  {item.spansMidnight ? ' · pokračuje přes půlnoc' : ''}
                  {item.isOngoing ? ' · právě probíhá' : ''}
                </span>
                {item.locationLabel ? (
                  <span className="mt-0.5 flex items-center gap-1 text-caption text-text-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {item.locationLabel}
                  </span>
                ) : null}
                {item.travelPlans.map((plan) => {
                  const participant = item.participants.find(
                    ({ id }) => id === plan.travelerUserId,
                  );
                  return plan.departureAt ? (
                    <span
                      key={plan.travelerUserId}
                      className={`mt-0.5 flex items-center gap-1 text-caption ${plan.hasConflict ? 'font-medium text-danger' : 'text-info'}`}
                    >
                      <Navigation className="size-3.5" aria-hidden="true" />
                      {participant?.displayName ?? 'Člen'}: přibližně{' '}
                      {Math.ceil((plan.durationSeconds ?? 0) / 60)} min · odjezd
                      v{' '}
                      {new Date(plan.departureAt).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {plan.hasConflict ? ' · nedostatek času' : ''}
                    </span>
                  ) : null;
                })}
              </button>
              {item.travelPlans
                .filter(
                  (plan) =>
                    plan.canRecalculate &&
                    ['STALE', 'FAILED'].includes(plan.status),
                )
                .slice(0, 1)
                .map((plan) => (
                  <Button
                    key={plan.travelerUserId}
                    size="sm"
                    variant="ghost"
                    disabled={recalculateTravel.isPending}
                    onClick={() =>
                      recalculateTravel.mutate({
                        eventId: item.id,
                        travelerUserId: plan.travelerUserId,
                      })
                    }
                  >
                    Přepočítat
                  </Button>
                ))}
              {item.participants.slice(0, 2).map((participant) => (
                <Avatar
                  key={participant.id}
                  imageUrl={participant.avatarUrl}
                  name={participant.displayName ?? 'Člen'}
                  size="sm"
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
