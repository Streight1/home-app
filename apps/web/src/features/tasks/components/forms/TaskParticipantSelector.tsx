import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import type { TaskMember } from '../../types/task.types.js';

const colorClass: Record<string, string> = {
  violet: 'bg-member-violet',
  blue: 'bg-member-blue',
  cyan: 'bg-member-cyan',
  green: 'bg-member-green',
  amber: 'bg-member-amber',
  orange: 'bg-member-orange',
  rose: 'bg-member-rose',
  pink: 'bg-member-pink',
};
const defaultColorClass = 'bg-member-violet';

export function TaskParticipantSelector({
  members,
  selected,
  error,
  onChange,
}: {
  members: TaskMember[];
  selected: string[];
  error?: string;
  onChange: (participantUserIds: string[]) => void;
}) {
  const toggle = (userId: string) =>
    onChange(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );
  return (
    <fieldset
      className="grid gap-2"
      aria-describedby={error ? 'task-participants-error' : undefined}
    >
      <legend className="mb-2 text-section-title font-semibold">
        2. Účastníci
      </legend>
      {members.map((member) => {
        const name = member.displayName ?? member.email;
        const colorToken = member.calendarColorToken;
        return (
          <label
            key={member.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={selected.includes(member.id)}
              onChange={() => toggle(member.id)}
              className="size-5 accent-primary"
            />
            <Avatar name={name} imageUrl={member.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span
              role="img"
              className={`size-3 rounded-full ${colorClass[colorToken] ?? defaultColorClass}`}
              aria-label={`Barva v kalendáři: ${colorToken}`}
            />
          </label>
        );
      })}
      {error ? (
        <p id="task-participants-error" className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
