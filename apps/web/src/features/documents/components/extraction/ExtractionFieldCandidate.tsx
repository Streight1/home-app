import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import type {
  DocumentTypeField,
  MetadataValue,
} from '../../types/document.types.js';
import type { ExtractionCandidate } from '../../types/extraction.types.js';
import { confidenceReasonLabel } from './confidenceReasons.js';

interface ExtractionFieldCandidateProps {
  candidate: ExtractionCandidate;
  definition?: DocumentTypeField;
  disabled: boolean;
  currentValue?: MetadataValue;
  onReview: (
    status: 'ACCEPTED' | 'EDITED' | 'REJECTED',
    value?: string | number | boolean,
  ) => void;
}

const statusLabels = {
  PROPOSED: 'Návrh',
  ACCEPTED: 'Přijato',
  EDITED: 'Upraveno',
  REJECTED: 'Odmítnuto',
} as const;

export function ExtractionFieldCandidate({
  candidate,
  definition,
  disabled,
  currentValue,
  onReview,
}: ExtractionFieldCandidateProps) {
  const [editing, setEditing] = useState(false);
  const displayValue = (input: MetadataValue) =>
    Array.isArray(input)
      ? input.map((item) => item.description).join(', ')
      : String(input);
  const [value, setValue] = useState(displayValue(candidate.normalizedValue));
  useEffect(
    () => setValue(displayValue(candidate.normalizedValue)),
    [candidate.normalizedValue],
  );
  const submitEdited = () => {
    const numeric =
      definition?.type === 'INTEGER' || definition?.type === 'MONEY_MINOR';
    onReview('EDITED', numeric ? Number(value) : value);
    setEditing(false);
  };
  return (
    <article
      className={`rounded-lg border bg-surface-raised p-4 ${candidate.confidence < 0.7 ? 'border-warning' : 'border-border'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-text">
            {definition?.label ?? candidate.fieldKey}
          </h3>
          <p className="mt-1 text-caption text-text-muted">
            Jistota {String(Math.round(candidate.confidence * 100))} %
            {candidate.sourcePage
              ? ` · strana ${String(candidate.sourcePage)}`
              : ''}
          </p>
        </div>
        <Badge
          variant={
            candidate.status === 'ACCEPTED' || candidate.status === 'EDITED'
              ? 'success'
              : candidate.status === 'PROPOSED'
                ? 'warning'
                : 'neutral'
          }
        >
          {statusLabels[candidate.status]}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-body-sm sm:grid-cols-2">
        <div>
          <dt className="text-caption font-medium text-text-subtle">
            Původní hodnota
          </dt>
          <dd className="mt-1 break-words text-text-muted">
            {candidate.rawValue}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-medium text-text-subtle">
            Normalizovaná hodnota
          </dt>
          <dd className="tabular-nums mt-1 break-words text-text">
            {displayValue(candidate.normalizedValue)}
          </dd>
        </div>
      </dl>
      {currentValue !== undefined ? (
        <div className="mt-3 rounded-md bg-selected p-3 text-body-sm">
          <p className="text-caption font-medium text-text-subtle">
            Současná potvrzená hodnota
          </p>
          <p className="mt-1 break-words text-text">
            {displayValue(currentValue)}
          </p>
        </div>
      ) : null}
      {candidate.confidenceReasons.length > 0 ? (
        <p className="mt-3 text-caption text-text-subtle">
          Důvody jistoty:{' '}
          {candidate.confidenceReasons.map(confidenceReasonLabel).join(', ')}
        </p>
      ) : null}
      {candidate.sourceRegion ? (
        <p className="mt-1 text-caption text-text-subtle">
          Zdrojová oblast: strana {String(candidate.sourceRegion.page)}, x{' '}
          {String(Math.round(candidate.sourceRegion.x))}, y{' '}
          {String(Math.round(candidate.sourceRegion.y))}
        </p>
      ) : null}
      {editing ? (
        <div className="mt-4 grid gap-3">
          <Input
            label="Upravená hodnota"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="text-caption text-warning" role="status">
            Máte neuloženou změnu.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={submitEdited}>
              Uložit a přijmout
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              Zrušit
            </Button>
          </div>
        </div>
      ) : !disabled && candidate.status === 'PROPOSED' ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onReview('ACCEPTED')}
          >
            <Check className="size-4" aria-hidden="true" /> Přijmout
          </Button>
          {!Array.isArray(candidate.normalizedValue) ? (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Upravit
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReview('REJECTED')}
          >
            <X className="size-4" aria-hidden="true" /> Odmítnout
          </Button>
        </div>
      ) : null}
    </article>
  );
}
