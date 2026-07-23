import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  DocumentListQuery,
  DocumentTypeDefinition,
  DocumentTypeKey,
} from '../../types/document.types.js';

export function DocumentLibraryToolbar({
  query,
  types,
  onChange,
}: {
  query: DocumentListQuery;
  types: readonly DocumentTypeDefinition[];
  onChange: (changes: Partial<DocumentListQuery>) => void;
}) {
  const [search, setSearch] = useState(query.query ?? '');
  useEffect(() => setSearch(query.query ?? ''), [query.query]);
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_14rem]">
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ query: search.trim() || undefined });
        }}
      >
        <Input
          label="Hledat"
          value={search}
          placeholder="Název, popis nebo soubor"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" aria-label="Spustit hledání">
          <Search className="size-4" aria-hidden="true" />
        </Button>
      </form>
      <Select
        label="Typ"
        value={query.type ?? ''}
        onChange={(event) =>
          onChange({
            type: event.target.value
              ? (event.target.value as DocumentTypeKey)
              : undefined,
          })
        }
      >
        <option value="">Všechny typy</option>
        {types.map((type) => (
          <option key={type.key} value={type.key}>
            {type.label}
          </option>
        ))}
      </Select>
      <Select
        label="Řazení"
        value={`${query.sortBy ?? 'createdAt'}:${query.sortDirection ?? 'desc'}`}
        onChange={(event) => {
          const [sortBy, sortDirection] = event.target.value.split(':');
          onChange({
            sortBy: sortBy as DocumentListQuery['sortBy'],
            sortDirection: sortDirection as 'asc' | 'desc',
          });
        }}
      >
        <option value="createdAt:desc">Nejnověji přidané</option>
        <option value="createdAt:asc">Nejstarší přidané</option>
        <option value="updatedAt:desc">Naposledy změněné</option>
        <option value="title:asc">Název A–Z</option>
        <option value="title:desc">Název Z–A</option>
        <option value="documentDate:desc">Datum dokumentu</option>
      </Select>
    </div>
  );
}
