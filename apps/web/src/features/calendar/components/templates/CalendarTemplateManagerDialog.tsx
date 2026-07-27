import { Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import {
  useCalendarMutations,
  useCalendarTemplates,
} from '../../hooks/useCalendar.js';
import { localIsoDate } from '../../lib/calendarDate.js';
import { selectedDaysLabel } from '../../lib/calendarMonth.js';
import type { CalendarTemplate } from '../../types/calendar.types.js';
import { CalendarMonthPicker } from './CalendarMonthPicker.js';
import { CalendarTemplateForm } from './CalendarTemplateForm.js';

export function CalendarTemplateManagerDialog({
  open,
  onOpenChange,
  onSelectAppliedEvents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAppliedEvents?: ((eventIds: string[]) => void) | undefined;
}) {
  const templates = useCalendarTemplates();
  const members = useHouseholdMembers();
  const mutations = useCalendarMutations();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CalendarTemplate | null>(null);
  const [applying, setApplying] = useState<CalendarTemplate | null>(null);
  const [month, setMonth] = useState(localIsoDate(new Date()).slice(0, 7));
  const [dates, setDates] = useState<string[]>([]);
  const [allowConflicts, setAllowConflicts] = useState(false);
  const [lastBatch, setLastBatch] = useState<string | null>(null);
  const [lastBatchEventIds, setLastBatchEventIds] = useState<string[]>([]);
  const apply = () => {
    if (!applying || !dates.length) return;
    const options = {
      templateId: applying.id,
      dates,
      ...(allowConflicts ? { allowShiftConflicts: true } : {}),
    };
    mutations.bulkApplyTemplate.mutate(options, {
      onSuccess: (result) => {
        setLastBatch(result.batchId);
        setLastBatchEventIds(result.events.map(({ id }) => id));
        setApplying(null);
        setDates([]);
      },
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Šablony událostí a směn"
      description="Šablony jsou schované mimo hlavní plochu kalendáře. Můžete je použít na jeden nebo více dní."
      size="lg"
      mobileFullScreen
    >
      {mutations.bulkApplyTemplate.isError ? (
        <InlineAlert variant="warning">
          {mutations.bulkApplyTemplate.error.message}
        </InlineAlert>
      ) : null}
      {lastBatch ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-success/30 bg-success-soft p-3 text-body-sm text-success">
          <span>Hromadné vložení proběhlo úspěšně.</span>
          <div className="flex flex-wrap gap-2">
            {onSelectAppliedEvents && lastBatchEventIds.length ? (
              <Button
                size="sm"
                onClick={() => {
                  onSelectAppliedEvents(lastBatchEventIds);
                  onOpenChange(false);
                }}
              >
                Vybrat události z tohoto vložení
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={() =>
                mutations.revertBatch.mutate(lastBatch, {
                  onSuccess: () => {
                    setLastBatch(null);
                    setLastBatchEventIds([]);
                  },
                })
              }
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Vrátit poslední vložení
            </Button>
          </div>
        </div>
      ) : null}
      {creating ? (
        <CalendarTemplateForm
          members={members.data ?? []}
          loading={mutations.createTemplate.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            mutations.createTemplate.mutate(input, {
              onSuccess: () => setCreating(false),
            })
          }
        />
      ) : editing ? (
        <CalendarTemplateForm
          initialValue={editing}
          members={members.data ?? []}
          loading={mutations.updateTemplate.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(input) =>
            mutations.updateTemplate.mutate(
              { templateId: editing.id, input },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      ) : applying ? (
        <div className="grid gap-4">
          <div className="rounded-md border border-border bg-surface-subtle p-3">
            <p className="font-semibold">{applying.name}</p>
            <p className="text-body-sm text-text-muted">
              {applying.startLocalTime}–{applying.endLocalTime}
              {applying.endDayOffset ? ' · končí další den' : ''}
            </p>
          </div>
          <CalendarMonthPicker
            month={month}
            selected={dates}
            onMonthChange={(next) => {
              setMonth(next);
              setDates([]);
            }}
            onSelectionChange={setDates}
          />
          <p className="font-semibold">
            Vybráno: {selectedDaysLabel(dates.length)}
          </p>
          <label className="flex min-h-11 items-center gap-3 text-body-sm">
            <input
              type="checkbox"
              checked={allowConflicts}
              onChange={(event) => setAllowConflicts(event.target.checked)}
              className="size-5 accent-primary"
            />
            Povolit potvrzené překryvy pracovních směn
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setApplying(null)}>Zpět</Button>
            <Button
              variant="primary"
              loading={mutations.bulkApplyTemplate.isPending}
              disabled={!dates.length}
              onClick={apply}
            >
              Vytvořit {dates.length} událostí
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nová šablona
            </Button>
          </div>
          {templates.isLoading ? (
            <LoadingScreen message="Načítáme šablony…" />
          ) : null}
          {templates.data?.items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-text-muted">
              Zatím nemáte žádnou šablonu.
            </p>
          ) : null}
          {templates.data?.items.map((template) => (
            <article
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-body-sm text-text-muted">
                  {template.title} · {template.startLocalTime}–
                  {template.endLocalTime}
                  {template.endDayOffset ? ' (+1 den)' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setApplying(template)}
                >
                  Použít
                </Button>
                <Button size="sm" onClick={() => setEditing(template)}>
                  Upravit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={mutations.deleteTemplate.isPending}
                  onClick={() => mutations.deleteTemplate.mutate(template.id)}
                >
                  Smazat
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Dialog>
  );
}
