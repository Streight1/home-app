import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import {
  useCalendarEvent,
  useCalendarMutations,
  useEventTravelPlans,
} from '../../hooks/useCalendar.js';
import { CalendarEventForm } from '../forms/CalendarEventForm.js';
import { useCurrentUser } from '../../../auth/hooks/useCurrentUser.js';
import { useCalendarPreferences } from '../../../location/hooks/useCalendarPreferences.js';

export function EventEditDialog({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const event = useCalendarEvent(eventId);
  const current = useCurrentUser();
  const preferences = useCalendarPreferences();
  const members = useHouseholdMembers();
  const travelPlans = useEventTravelPlans(eventId);
  const { updateEvent } = useCalendarMutations();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !updateEvent.isPending && onOpenChange(next)}
      title="Upravit událost"
      size="lg"
      mobileFullScreen
    >
      {event.isLoading ? <LoadingScreen message="Načítáme událost…" /> : null}
      {event.data ? (
        <CalendarEventForm
          initial={event.data}
          {...(travelPlans.data?.items[0]
            ? { initialTravelPlan: travelPlans.data.items[0] }
            : {})}
          members={members.data ?? []}
          currentUserId={current.data?.user.id ?? ''}
          defaultWorkShiftParticipantId={
            preferences.data?.lastWorkShiftParticipantUserId
          }
          loading={updateEvent.isPending}
          error={updateEvent.isError ? updateEvent.error.message : null}
          onCancel={() => onOpenChange(false)}
          onSubmit={(input) =>
            updateEvent.mutate(
              { eventId, input },
              { onSuccess: () => onOpenChange(false) },
            )
          }
        />
      ) : null}
    </Dialog>
  );
}
