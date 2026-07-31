import { ClipboardCheck, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useExpeditionMutations } from '../../hooks/useExpeditions.js';
import type { ReviewOutcome, Trip } from '../../types/expeditions.types.js';
import { TripTemplateReviewSuggestions } from './TripTemplateReviewSuggestions.js';

const outcomeLabels: Record<ReviewOutcome, string> = {
  USED: 'Použito',
  UNUSED: 'Nepoužito',
  MISSING_DURING_TRIP: 'Chybělo',
  BROKEN: 'Rozbilo se',
  NOT_REVIEWED: 'Bez hodnocení',
};

export function TripReviewPanel({
  trip,
  canWrite,
}: {
  trip: Trip;
  canWrite: boolean;
}) {
  const [completeOpen, setCompleteOpen] = useState(false);
  const [values, setValues] = useState(
    new Map<string, { outcome: ReviewOutcome; notes: string }>(),
  );
  const mutations = useExpeditionMutations();
  useEffect(() => {
    setValues(
      new Map(
        trip.items.map((item) => [
          item.id,
          {
            outcome: item.reviewOutcome,
            notes: item.reviewNotes ?? '',
          },
        ]),
      ),
    );
  }, [trip.items]);
  if (!canWrite && trip.status !== 'COMPLETED') return null;
  return (
    <section className="grid gap-4" aria-labelledby="trip-review-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="trip-review-title"
            className="text-section-title font-semibold"
          >
            Vyhodnocení po výpravě
          </h3>
          <p className="text-body-sm text-text-muted">
            Návrhy změn gearlistu se nikdy neaplikují bez dalšího potvrzení.
          </p>
        </div>
        {canWrite && trip.status !== 'COMPLETED' ? (
          <Button onClick={() => setCompleteOpen(true)}>
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Dokončit výpravu
          </Button>
        ) : null}
      </div>
      {trip.status === 'COMPLETED' ? (
        <>
          <div className="grid gap-3">
            {trip.items.map((item) => {
              const value = values.get(item.id) ?? {
                outcome: 'NOT_REVIEWED' as const,
                notes: '',
              };
              return (
                <article
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_12rem]"
                >
                  <div>
                    <strong>{item.name}</strong>
                    <Textarea
                      className="mt-2 min-h-20"
                      label={`Poznámka k položce ${item.name}`}
                      value={value.notes}
                      onChange={(event) =>
                        setValues((current) => {
                          const next = new Map(current);
                          next.set(item.id, {
                            ...value,
                            notes: event.target.value,
                          });
                          return next;
                        })
                      }
                    />
                  </div>
                  <div className="grid content-start gap-2">
                    <Select
                      label="Výsledek"
                      value={value.outcome}
                      onChange={(event) =>
                        setValues((current) => {
                          const next = new Map(current);
                          next.set(item.id, {
                            ...value,
                            outcome: event.target.value as ReviewOutcome,
                          });
                          return next;
                        })
                      }
                    >
                      {Object.entries(outcomeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    {value.outcome === 'BROKEN' ||
                    value.outcome === 'MISSING_DURING_TRIP' ? (
                      <Button
                        type="button"
                        loading={mutations.createTask.isPending}
                        onClick={() =>
                          mutations.createTask.mutate({
                            tripId: trip.id,
                            input: {
                              itemId: item.id,
                              title:
                                value.outcome === 'BROKEN'
                                  ? `Opravit: ${item.name}`
                                  : `Doplnit: ${item.name}`,
                            },
                          })
                        }
                      >
                        <Wrench className="size-4" aria-hidden="true" />
                        Vytvořit úkol
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {mutations.review.error ? (
            <InlineAlert variant="danger">
              Vyhodnocení se nepodařilo uložit.
            </InlineAlert>
          ) : null}
          <Button
            variant="primary"
            loading={mutations.review.isPending}
            onClick={() =>
              mutations.review.mutate({
                tripId: trip.id,
                items: [...values].map(([itemId, value]) => ({
                  itemId,
                  outcome: value.outcome,
                  ...(value.notes.trim() ? { notes: value.notes.trim() } : {}),
                })),
              })
            }
          >
            Uložit vyhodnocení
          </Button>
          <TripTemplateReviewSuggestions
            tripId={trip.id}
            enabled={Boolean(trip.createdFromTemplateId)}
          />
        </>
      ) : null}
      <Dialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Dokončit výpravu?"
        description="Po dokončení můžete u každé položky zaznamenat, zda byla použitá, chyběla nebo se rozbila."
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setCompleteOpen(false)}>Zpět</Button>
          <Button
            variant="primary"
            loading={mutations.complete.isPending}
            onClick={() =>
              mutations.complete.mutate(trip.id, {
                onSuccess: () => setCompleteOpen(false),
              })
            }
          >
            Dokončit výpravu
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
