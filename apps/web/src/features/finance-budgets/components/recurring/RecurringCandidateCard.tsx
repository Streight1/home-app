import { Check, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import type { RecurringCandidate } from '../../types/finance-budget.types.js';

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Týdně',
  MONTHLY: 'Měsíčně',
  QUARTERLY: 'Čtvrtletně',
  YEARLY: 'Ročně',
  IRREGULAR: 'Nepravidelně',
};

export function RecurringCandidateCard({
  candidate,
  canWrite,
  pending,
  onConfirm,
  onDismiss,
}: {
  candidate: RecurringCandidate;
  canWrite: boolean;
  pending: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{candidate.merchantNormalizedName}</h4>
          <p className="mt-1 text-caption text-text-muted">
            {candidate.account.name} ·{' '}
            {candidate.category?.name ?? 'Nezařazeno'} ·{' '}
            {frequencyLabel[candidate.detectedFrequency]}
          </p>
        </div>
        <strong className="tabular-nums">
          {formatMinorUnits(
            candidate.typicalAmountMinor,
            candidate.currencyCode,
          )}
        </strong>
      </div>
      <p className="mt-3 text-body-sm text-text-muted">
        Rozpoznáno z {candidate.evidenceTransactionCount} plateb · síla vzoru{' '}
        {candidate.confidenceScore}/100.
      </p>
      {canWrite ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" loading={pending} onClick={onConfirm}>
            <Check className="size-4" aria-hidden="true" />
            Potvrdit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={onDismiss}
          >
            <X className="size-4" aria-hidden="true" />
            Odmítnout
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
