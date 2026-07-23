import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { priorityLabels } from '../../lib/taskDate.js';
import type { TaskPriority } from '../../types/task.types.js';

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'NORMAL') return null;
  return (
    <Badge
      variant={
        priority === 'URGENT'
          ? 'warning'
          : priority === 'HIGH'
            ? 'primary'
            : 'neutral'
      }
    >
      {priorityLabels[priority]}
    </Badge>
  );
}
