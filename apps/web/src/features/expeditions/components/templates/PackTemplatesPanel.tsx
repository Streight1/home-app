import { Copy, ListChecks, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { usePackTemplates } from '../../hooks/useExpeditions.js';
import { formatWeight, TRIP_TYPE_LABELS } from '../../lib/expeditionLabels.js';
import { PackTemplateDialog } from '../dialogs/PackTemplateDialog.js';

export function PackTemplatesPanel({ canWrite }: { canWrite: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const templates = usePackTemplates();
  return (
    <section className="grid gap-4" aria-labelledby="pack-templates-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="pack-templates-title"
            className="text-section-title font-semibold"
          >
            Opakovaně použitelné gearlisty
          </h2>
          <p className="text-body-sm text-text-muted">
            Každá šablona drží snapshot názvu a hmotnosti položky.
          </p>
        </div>
        {canWrite ? (
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nový gearlist
          </Button>
        ) : null}
      </div>
      {templates.isError ? (
        <InlineAlert variant="danger">
          Gearlisty se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      {templates.data?.length === 0 ? (
        <EmptyState
          eyebrow={<ListChecks className="mx-auto size-6" aria-hidden="true" />}
          title="Zatím nemáte žádný gearlist"
          description="Připravte si letní, zimní nebo víkendovou variantu a při výpravě ji upravte bez změny šablony."
          action={
            canWrite ? (
              <Button onClick={() => setDialogOpen(true)}>
                Vytvořit gearlist
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(templates.data ?? []).map((template) => (
          <article
            key={template.id}
            className="rounded-lg border border-border bg-surface-raised p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-body-sm text-text-muted">
                  {TRIP_TYPE_LABELS[template.tripType]}
                  {template.seasonLabel ? ` · ${template.seasonLabel}` : ''}
                </p>
              </div>
              <Copy
                className="size-5 text-primary-emphasis"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{template.items.length} položek</Badge>
              {template.targetBaseWeightGrams !== null ? (
                <Badge variant="primary">
                  Cíl {formatWeight(template.targetBaseWeightGrams)}
                </Badge>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <PackTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
