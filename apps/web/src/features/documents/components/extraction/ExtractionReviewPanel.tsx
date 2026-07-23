import { Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import type {
  DocumentTypeDefinition,
  MetadataValue,
} from '../../types/document.types.js';
import type { ExtractionJob } from '../../types/extraction.types.js';
import { ExtractionFieldCandidate } from './ExtractionFieldCandidate.js';

const extractionGroups = [
  {
    label: 'Dodavatel',
    keys: ['supplierName', 'supplierCompanyId', 'supplierVatId'],
  },
  {
    label: 'Identifikace faktury',
    keys: ['invoiceNumber', 'orderNumber', 'purchaseSummary'],
  },
  { label: 'Data', keys: ['issueDate', 'taxableSupplyDate', 'dueDate'] },
  {
    label: 'Částky',
    keys: [
      'subtotalAmountMinor',
      'vatAmountMinor',
      'totalAmountMinor',
      'currencyCode',
    ],
  },
  {
    label: 'Platba',
    keys: [
      'variableSymbol',
      'constantSymbol',
      'supplierBankAccount',
      'supplierIban',
    ],
  },
  { label: 'Položky', keys: ['lineItems'] },
] as const;

interface ExtractionReviewPanelProps {
  job: ExtractionJob;
  definition: DocumentTypeDefinition | undefined;
  canMutate: boolean;
  busy: boolean;
  confirmedMetadata?: Readonly<Record<string, MetadataValue>>;
  onReview: (
    candidateId: string,
    status: 'ACCEPTED' | 'EDITED' | 'REJECTED',
    value?: string | number | boolean,
  ) => void;
  onAcceptSafe: () => void;
}

export function ExtractionReviewPanel({
  job,
  definition,
  canMutate,
  busy,
  confirmedMetadata = {},
  onReview,
  onAcceptSafe,
}: ExtractionReviewPanelProps) {
  if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
    return (
      <div className="grid min-h-64 place-items-center" role="status">
        <span className="flex items-center gap-3 text-body-sm text-text-muted">
          <Spinner /> Dokument bezpečně zpracováváme…
        </span>
      </div>
    );
  }
  if (job.status === 'FAILED') {
    return (
      <InlineAlert variant="warning" title="Vytěžení nebylo dokončeno">
        {job.errorCode === 'OCR_NOT_CONFIGURED' ||
        job.errorCode === 'EXTRACTION_NOT_CONFIGURED'
          ? 'OCR obrázků zatím není nakonfigurováno. Nevytváříme náhradní ani smyšlený výsledek.'
          : 'Soubor se nepodařilo vytěžit. Můžete proces spustit znovu.'}
      </InlineAlert>
    );
  }
  const groupedKeys = new Set<string>(
    extractionGroups.flatMap((group) => [...group.keys]),
  );
  const otherCandidates = job.candidates.filter(
    (candidate) => !groupedKeys.has(candidate.fieldKey),
  );
  return (
    <section aria-labelledby="extraction-fields-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="extraction-fields-title"
            className="text-section-title font-semibold text-text"
          >
            Návrhy polí
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Nic se nezapíše bez vašeho výslovného potvrzení.
          </p>
        </div>
        {canMutate &&
        job.candidates.some(
          (candidate) =>
            candidate.status === 'PROPOSED' &&
            candidate.confidence >= 0.85 &&
            !(candidate.fieldKey in confirmedMetadata),
        ) ? (
          <Button variant="primary" loading={busy} onClick={onAcceptSafe}>
            <Sparkles className="size-4" aria-hidden="true" />
            Přijmout bezpečné návrhy
          </Button>
        ) : null}
      </div>
      {job.candidates.length === 0 ? (
        <InlineAlert variant="info">
          V textové vrstvě nebyla rozpoznána podporovaná pole.
        </InlineAlert>
      ) : (
        <div className="grid gap-5">
          {extractionGroups.map((group) => {
            const candidates = job.candidates.filter((candidate) =>
              group.keys.some((key) => key === candidate.fieldKey),
            );
            if (candidates.length === 0) return null;
            return (
              <section key={group.label} aria-label={group.label}>
                <h3 className="mb-2 font-semibold text-text">{group.label}</h3>
                <div className="grid gap-3">
                  {candidates.map((candidate) => {
                    const field = definition?.fields.find(
                      (item) => item.key === candidate.fieldKey,
                    );
                    const currentValue = confirmedMetadata[candidate.fieldKey];
                    return (
                      <ExtractionFieldCandidate
                        key={candidate.id}
                        candidate={candidate}
                        {...(field ? { definition: field } : {})}
                        disabled={!canMutate || busy}
                        {...(currentValue !== undefined
                          ? { currentValue }
                          : {})}
                        onReview={(status, value) =>
                          onReview(candidate.id, status, value)
                        }
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
          {otherCandidates.length > 0 ? (
            <section aria-label="Ostatní údaje">
              <h3 className="mb-2 font-semibold text-text">Ostatní údaje</h3>
              <div className="grid gap-3">
                {otherCandidates.map((candidate) => {
                  const field = definition?.fields.find(
                    (item) => item.key === candidate.fieldKey,
                  );
                  const currentValue = confirmedMetadata[candidate.fieldKey];
                  return (
                    <ExtractionFieldCandidate
                      key={candidate.id}
                      candidate={candidate}
                      {...(field ? { definition: field } : {})}
                      disabled={!canMutate || busy}
                      {...(currentValue !== undefined ? { currentValue } : {})}
                      onReview={(status, value) =>
                        onReview(candidate.id, status, value)
                      }
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
