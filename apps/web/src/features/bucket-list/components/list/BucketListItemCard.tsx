import {
  CalendarDays,
  Check,
  Ellipsis,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../../../../components/ui/DropdownMenu/DropdownMenu.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import {
  bucketListCategoryLabels,
  bucketListStatusLabels,
  formatBucketDate,
} from '../../lib/bucketListLabels.js';
import type { BucketListItem } from '../../types/bucket-list.types.js';

export function BucketListItemCard({
  item,
  busy = false,
  onOpen,
  onEdit,
  onAction,
}: {
  item: BucketListItem;
  busy?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onAction: (
    action: 'complete' | 'reopen' | 'skip' | 'restore' | 'delete',
  ) => void;
}) {
  const date = formatBucketDate(item.targetDate);
  return (
    <article className="group rounded-lg border border-border bg-surface-raised p-4 shadow-sm transition-colors hover:border-border-strong">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-focus"
          onClick={onOpen}
        >
          <span className="flex flex-wrap items-center gap-2">
            <strong className="break-words text-section-title">
              {item.title}
            </strong>
            <Badge
              variant={
                item.status === 'COMPLETED'
                  ? 'success'
                  : item.status === 'SKIPPED'
                    ? 'warning'
                    : 'primary'
              }
            >
              {bucketListStatusLabels[item.status]}
            </Badge>
          </span>
          {item.description ? (
            <span className="mt-2 line-clamp-2 block text-body-sm text-text-muted">
              {item.description}
            </span>
          ) : null}
        </button>
        {item.permissions.canEdit ? (
          <DropdownMenu
            label={`Akce pro ${item.title}`}
            trigger={
              <IconButton aria-label={`Další akce pro ${item.title}`}>
                <Ellipsis className="size-5" aria-hidden="true" />
              </IconButton>
            }
          >
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="size-4" aria-hidden="true" /> Upravit
            </DropdownMenuItem>
            {item.permissions.canComplete ? (
              <DropdownMenuItem
                disabled={busy}
                onSelect={() => onAction('complete')}
              >
                <Check className="size-4" aria-hidden="true" /> Označit jako
                splněné
              </DropdownMenuItem>
            ) : null}
            {item.permissions.canReopen || item.permissions.canRestore ? (
              <DropdownMenuItem
                disabled={busy}
                onSelect={() =>
                  onAction(item.permissions.canReopen ? 'reopen' : 'restore')
                }
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Vrátit do
                plánu
              </DropdownMenuItem>
            ) : null}
            {item.permissions.canSkip ? (
              <DropdownMenuItem
                disabled={busy}
                onSelect={() => onAction('skip')}
              >
                Přeskočit letos
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem danger onSelect={() => onAction('delete')}>
              <Trash2 className="size-4" aria-hidden="true" /> Smazat
            </DropdownMenuItem>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-muted">
        <span>{bucketListCategoryLabels[item.category]}</span>
        {date ? (
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden="true" /> {date}
          </span>
        ) : null}
        {item.location?.label ? (
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.location.label}</span>
          </span>
        ) : null}
        {item.participants.length ? (
          <span
            className="flex -space-x-2"
            role="group"
            aria-label={`Účastníci: ${item.participants.map((participant) => participant.displayName ?? participant.email).join(', ')}`}
          >
            {item.participants.slice(0, 3).map((participant) => (
              <Avatar
                key={participant.id}
                name={participant.displayName ?? participant.email}
                imageUrl={participant.avatarUrl}
                size="sm"
              />
            ))}
          </span>
        ) : null}
      </div>
    </article>
  );
}
