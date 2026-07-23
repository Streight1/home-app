import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';

export function BucketListParticipantPicker({
  members,
  selected,
  onChange,
}: {
  members: HouseholdMemberSummary[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-semibold">Účastníci</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {members.map((member) => {
          const name = member.displayName ?? member.email;
          return (
            <label
              key={member.id}
              className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={selected.includes(member.id)}
                className="size-5 accent-primary"
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, member.id]
                      : selected.filter((id) => id !== member.id),
                  )
                }
              />
              <Avatar name={name} imageUrl={member.avatarUrl} size="sm" />
              <span className="min-w-0 truncate text-body-sm">{name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
