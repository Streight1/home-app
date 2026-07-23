import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import type { CalendarEventType } from '../../types/calendar.types.js';

const colorClasses = {
  violet: 'bg-member-violet',
  blue: 'bg-member-blue',
  cyan: 'bg-member-cyan',
  green: 'bg-member-green',
  amber: 'bg-member-amber',
  orange: 'bg-member-orange',
  rose: 'bg-member-rose',
  pink: 'bg-member-pink',
} as const;

export function EventParticipantSelector({
  type,
  members,
  selected,
  onToggle,
}: {
  type: CalendarEventType;
  members: HouseholdMemberSummary[];
  selected: string[];
  onToggle: (userId: string) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-section-title font-semibold">
        Účastníci
      </legend>
      {members.map((member) => (
        <label
          key={member.id}
          className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 hover:bg-surface-hover"
        >
          <input
            type={type === 'WORK_SHIFT' ? 'radio' : 'checkbox'}
            name={type === 'WORK_SHIFT' ? 'shift-participant' : undefined}
            checked={selected.includes(member.id)}
            onChange={() => onToggle(member.id)}
            className="size-5 accent-primary"
          />
          <span>{member.displayName ?? member.email}</span>
          <span
            className={`ml-auto size-3 rounded-full ${colorClasses[member.calendarColorToken ?? 'violet']}`}
            aria-hidden="true"
          />
        </label>
      ))}
      {members.length === 1 ? (
        <p className="text-caption text-text-muted">
          Další člen se zobrazí po prvním přihlášení povoleným Google účtem.
        </p>
      ) : null}
      {type === 'WORK_SHIFT' ? (
        <p className="text-caption text-text-muted">
          Pracovní směna musí mít právě jednoho hlavního účastníka.
        </p>
      ) : null}
    </fieldset>
  );
}
