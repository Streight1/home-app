import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import type { MealParticipant } from '../../types/meals.types.js';

export function MealParticipantPicker({
  members,
  selected,
  onChange,
}: {
  members: MealParticipant[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-semibold">Účastníci</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {members.map((member) => (
          <label
            key={member.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              aria-label={member.displayName}
              className="size-5 accent-primary"
              checked={selected.includes(member.id)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, member.id]
                    : selected.filter((id) => id !== member.id),
                )
              }
            />
            <Avatar
              name={member.displayName}
              imageUrl={member.avatarUrl}
              size="sm"
            />
            <span className="truncate text-body-sm">{member.displayName}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
