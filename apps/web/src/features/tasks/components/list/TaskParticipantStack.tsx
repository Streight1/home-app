import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import type { TaskParticipant } from '../../types/task.types.js';

export function TaskParticipantStack({
  participants,
}: {
  participants: TaskParticipant[];
}) {
  if (participants.length === 0)
    return <span className="text-text-muted">Bez účastníka</span>;
  const names = participants.map(
    (participant) => participant.displayName ?? participant.email,
  );
  return (
    <span
      className="inline-flex min-w-0 items-center gap-2"
      aria-label={`Účastníci: ${names.join(', ')}`}
    >
      <span className="flex -space-x-2" aria-hidden="true">
        {participants.slice(0, 3).map((participant) => (
          <span
            key={participant.id}
            className="rounded-full ring-2 ring-surface"
          >
            <Avatar
              name={participant.displayName ?? participant.email}
              imageUrl={participant.avatarUrl}
              size="sm"
            />
          </span>
        ))}
      </span>
      <span className="truncate">{names.join(', ')}</span>
    </span>
  );
}
