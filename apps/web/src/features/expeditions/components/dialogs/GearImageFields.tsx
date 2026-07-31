import { Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { useExpeditionMutations } from '../../hooks/useExpeditions.js';

interface GearImageFieldsProps {
  file: File | null;
  imageUrl: string;
  attribution: string;
  disabled: boolean;
  onFile: (file: File | null) => void;
  onImageUrl: (value: string) => void;
  onAttribution: (value: string) => void;
}

const sourceLabel = (sourcePageUrl: string) => {
  try {
    return new URL(sourcePageUrl).hostname;
  } catch {
    return 'Zdroj fotografie';
  }
};

export function GearImageFields({
  file,
  imageUrl,
  attribution,
  disabled,
  onFile,
  onImageUrl,
  onAttribution,
}: GearImageFieldsProps) {
  const [query, setQuery] = useState('');
  const search = useExpeditionMutations().searchImages;
  return (
    <fieldset className="grid gap-3 rounded-lg border border-border p-4">
      <legend className="px-2 text-body-sm font-semibold">
        Fotografie z internetu
      </legend>
      <label className="grid gap-2 text-body-sm font-medium">
        <span>Vlastní fotografie</span>
        <span className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-input px-3">
          <Upload className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={disabled}
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </span>
        <span className="text-caption font-normal text-text-muted">
          {file
            ? `Vybráno: ${file.name}`
            : 'JPEG nebo PNG se uloží přes modul Dokumenty.'}
        </span>
      </label>
      <Input
        label="Přímá HTTPS adresa fotografie"
        type="url"
        value={imageUrl}
        disabled={disabled}
        onChange={(event) => onImageUrl(event.target.value)}
        hint="Server ověří veřejnou adresu, typ a velikost, odstraní metadata a uloží vlastní kopii do Dokumentů."
      />
      <Input
        label="Zdroj nebo autor fotografie"
        value={attribution}
        disabled={disabled}
        onChange={(event) => onAttribution(event.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input
          label="Vyhledat fotografii"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button
          type="button"
          disabled={query.trim().length < 2 || disabled}
          loading={search.isPending}
          onClick={() => search.mutate(query.trim())}
        >
          <Search className="size-4" aria-hidden="true" />
          Vyhledat
        </Button>
      </div>
      {search.data && !search.data.configured ? (
        <InlineAlert>
          Vyhledávání obrázků není nakonfigurované. Použijte vlastní fotografii
          nebo přímou HTTPS adresu.
        </InlineAlert>
      ) : null}
      {search.data?.configured && search.data.results.length === 0 ? (
        <p className="text-body-sm text-text-muted">
          Vyhledávání nevrátilo žádný obrázek.
        </p>
      ) : null}
      {search.data?.results.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {search.data.results.map((result) => (
            <article
              key={result.id}
              className="grid gap-2 rounded-md border border-border p-3"
            >
              <img
                className="aspect-video w-full rounded object-cover"
                src={result.previewUrl}
                alt=""
              />
              <a
                className="text-caption text-link underline"
                href={result.sourcePageUrl}
                target="_blank"
                rel="noreferrer"
              >
                {result.attribution ?? sourceLabel(result.sourcePageUrl)}
              </a>
              <Button
                type="button"
                onClick={() => {
                  onImageUrl(result.imageUrl);
                  onAttribution(result.attribution ?? result.sourcePageUrl);
                }}
              >
                Vybrat tuto fotografii
              </Button>
            </article>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}
