import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import { useCalendarMutations } from '../../hooks/useCalendar.js';
import { CalendarEventForm } from '../forms/CalendarEventForm.js';
import { useCurrentUser } from '../../../auth/hooks/useCurrentUser.js';
import { useCalendarPreferences } from '../../../location/hooks/useCalendarPreferences.js';
import type { CalendarEventDraft } from '../../types/calendar.types.js';

export function EventCreateDialog({
  open,
  onOpenChange,
  draft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CalendarEventDraft;
}) {
  const members = useHouseholdMembers();
  const current = useCurrentUser();
  const preferences = useCalendarPreferences();
  const { createEvent } = useCalendarMutations();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !createEvent.isPending && onOpenChange(next)}
      title="Nová událost"
      description="Přidejte společnou událost, osobní termín nebo pracovní směnu."
      size="lg"
      mobileFullScreen
    >
      <CalendarEventForm
        initialDraft={draft}
        members={members.data ?? []}
        currentUserId={current.data?.user.id ?? ''}
        defaultWorkShiftParticipantId={
          preferences.data?.lastWorkShiftParticipantUserId
        }
        loading={createEvent.isPending}
        error={createEvent.isError ? createEvent.error.message : null}
        onCancel={() => onOpenChange(false)}
        onSubmit={(input) =>
          createEvent.mutate(input, { onSuccess: () => onOpenChange(false) })
        }
      />
    </Dialog>
  );
}
