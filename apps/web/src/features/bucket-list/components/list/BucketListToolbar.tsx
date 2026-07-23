import { Search } from 'lucide-react';
import { Select } from '../../../../components/ui/Select/Select.js';
import { bucketListCategoryLabels } from '../../lib/bucketListLabels.js';
import type {
  BucketListFilters,
  BucketListItemStatus,
  BucketListParticipant,
} from '../../types/bucket-list.types.js';

export function BucketListToolbar({
  filters,
  participants = [],
  onChange,
}: {
  filters: BucketListFilters;
  participants?: readonly Pick<
    BucketListParticipant,
    'id' | 'displayName' | 'email'
  >[];
  onChange: (filters: BucketListFilters) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-3 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_repeat(4,minmax(9rem,auto))]">
      <label className="relative">
        <span className="sr-only">Hledat v seznamu</span>
        <Search
          className="pointer-events-none absolute left-3 top-3.5 size-4 text-text-muted"
          aria-hidden="true"
        />
        <input
          value={filters.query ?? ''}
          placeholder="Hledat přání"
          className="min-h-11 w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-body-sm focus-visible:outline-2 focus-visible:outline-focus"
          onChange={(event) =>
            onChange({
              ...filters,
              ...(event.target.value
                ? { query: event.target.value }
                : { query: undefined }),
            } as BucketListFilters)
          }
        />
      </label>
      <Select
        label="Stav"
        className="md:min-w-36"
        value={filters.status ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
              ? {
                  ...filters,
                  status: event.target.value as BucketListItemStatus,
                }
              : Object.fromEntries(
                  Object.entries(filters).filter(([key]) => key !== 'status'),
                ),
          )
        }
      >
        <option value="">Všechny stavy</option>
        <option value="PLANNED">Plánujeme</option>
        <option value="COMPLETED">Splněno</option>
        <option value="SKIPPED">Přeskočeno</option>
      </Select>
      <Select
        label="Kategorie"
        className="md:min-w-36"
        value={filters.category ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
              ? {
                  ...filters,
                  category: event.target.value as NonNullable<
                    BucketListFilters['category']
                  >,
                }
              : Object.fromEntries(
                  Object.entries(filters).filter(([key]) => key !== 'category'),
                ),
          )
        }
      >
        <option value="">Všechny kategorie</option>
        {Object.entries(bucketListCategoryLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        label="Účastník"
        className="md:min-w-36"
        value={filters.participantUserId ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
              ? { ...filters, participantUserId: event.target.value }
              : Object.fromEntries(
                  Object.entries(filters).filter(
                    ([key]) => key !== 'participantUserId',
                  ),
                ),
          )
        }
      >
        <option value="">Všichni účastníci</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.id}>
            {participant.displayName ?? participant.email}
          </option>
        ))}
      </Select>
      <Select
        label="Řazení"
        className="md:min-w-40"
        value={filters.sortBy ?? 'sortOrder'}
        onChange={(event) =>
          onChange({
            ...filters,
            sortBy: event.target.value as NonNullable<
              BucketListFilters['sortBy']
            >,
            sortDirection:
              event.target.value === 'completedAt' ? 'desc' : 'asc',
          })
        }
      >
        <option value="sortOrder">Vlastní pořadí</option>
        <option value="targetDate">Cílové datum</option>
        <option value="title">Název</option>
        <option value="createdAt">Datum přidání</option>
        <option value="completedAt">Datum splnění</option>
      </Select>
    </div>
  );
}
