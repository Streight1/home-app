import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { formatCalendarInterval } from '../../lib/calendarDate.js';
import type { CalendarEvent } from '../../types/calendar.types.js';

export function CalendarEventDeleteDialog({
  event,
  open,
  pending,
  error,
  onOpenChange,
  onConfirm,
}: {
  event: CalendarEvent;
  open: boolean;
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const participants = event.participants
    .map(({ user }) => user.displayName ?? user.email ?? 'Člen domácnosti')
    .join(', ');
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
      title="Smazat událost?"
      description="Událost zmizí z běžných kalendářových pohledů. Zrušení události zůstává samostatná historická operace."
      size="sm"
      mobileFullScreen
    >
      <div className="grid gap-4">
        <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle p-4 text-body-sm">
          <div>
            <dt className="text-text-muted">Událost</dt>
            <dd className="font-semibold">{event.title}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Čas</dt>
            <dd className="tabular-nums">
              {formatCalendarInterval({
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                timezone: event.timezone,
                isAllDay: event.isAllDay,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Účastníci</dt>
            <dd>{participants || 'Bez účastníků'}</dd>
          </div>
        </dl>
        {event.source === 'TASK' ? (
          <InlineAlert variant="warning">
            Událost bude odstraněna z kalendáře. Původní úkol zůstane zachovaný
            a půjde znovu naplánovat.
          </InlineAlert>
        ) : null}
        {event.source === 'TEMPLATE' ? (
          <InlineAlert variant="info">
            Smaže se jen tato událost. Šablona ani ostatní události stejné dávky
            se nezmění.
          </InlineAlert>
        ) : null}
        {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
        <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={() => onOpenChange(false)}>
            Zpět
          </Button>
          <Button variant="danger" loading={pending} onClick={onConfirm}>
            Smazat událost
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
