import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import { useMaintenanceMutations } from '../../hooks/useMaintenance.js';
import { localIsoDate } from '../../lib/maintenanceFormat.js';
import type { MaintenanceOccurrence } from '../../types/maintenance.types.js';
import { MaintenanceMoneyField } from '../forms/MaintenanceMoneyField.js';
import { MaintenanceDocumentPicker } from '../occurrences/MaintenanceDocumentPicker.js';
import { MaintenanceTransactionPicker } from '../occurrences/MaintenanceTransactionPicker.js';

export function MaintenanceOccurrenceDialog({
  occurrence,
  action,
  onClose,
}: {
  occurrence: MaintenanceOccurrence;
  action: 'complete' | 'skip' | 'reschedule';
  onClose: () => void;
}) {
  const mutations = useMaintenanceMutations();
  const members = useHouseholdMembers();
  const [date, setDate] = useState(
    action === 'reschedule' ? occurrence.scheduledFor : localIsoDate(),
  );
  const [notes, setNotes] = useState('');
  const [providerName, setProviderName] = useState(
    occurrence.providerName ?? '',
  );
  const [completedByUserId, setCompletedByUserId] = useState(
    occurrence.plan.responsible?.id ?? '',
  );
  const [cost, setCost] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [nextDueOn, setNextDueOn] = useState('');
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [transactionIds, setTransactionIds] = useState<string[]>([]);
  const mutation =
    action === 'complete'
      ? mutations.complete
      : action === 'skip'
        ? mutations.skip
        : mutations.reschedule;
  const submit = () => {
    if (action === 'complete')
      mutations.complete.mutate(
        {
          occurrenceId: occurrence.id,
          input: {
            completedOn: date,
            ...(completedByUserId ? { completedByUserId } : {}),
            notes: notes || null,
            providerName: providerName || null,
            actualCostMinor: cost,
            currencyCode: cost ? currency : null,
            ...(nextDueOn ? { nextDueOn } : {}),
            documentIds,
            transactionIds,
          },
        },
        { onSuccess: onClose },
      );
    else if (action === 'skip')
      mutations.skip.mutate(
        { occurrenceId: occurrence.id, reason: notes || null },
        { onSuccess: onClose },
      );
    else
      mutations.reschedule.mutate(
        { occurrenceId: occurrence.id, scheduledFor: date },
        { onSuccess: onClose },
      );
  };
  const title =
    action === 'complete'
      ? 'Dokončit záznam údržby'
      : action === 'skip'
        ? 'Přeskočit termín'
        : 'Přeplánovat termín';
  return (
    <Dialog
      title={title}
      description={occurrence.plan.title}
      size="lg"
      mobileFullScreen
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {action !== 'skip' ? (
          <DatePicker
            label={action === 'complete' ? 'Datum provedení' : 'Nový termín'}
            value={date}
            onChange={setDate}
          />
        ) : null}
        {action === 'complete' ? (
          <>
            <Input
              label="Dodavatel"
              value={providerName}
              onChange={(event) => setProviderName(event.target.value)}
            />
            <Select
              label="Údržbu provedl"
              value={completedByUserId}
              onChange={(event) => setCompletedByUserId(event.target.value)}
            >
              <option value="">Aktuální uživatel</option>
              {(members.data ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName ?? member.email}
                </option>
              ))}
            </Select>
            <MaintenanceMoneyField
              label="Skutečná cena"
              amountMinor={cost}
              currencyCode={currency}
              onChange={(value) => {
                setCost(value.amountMinor);
                setCurrency(value.currencyCode);
              }}
            />
            <DatePicker
              label="Příští termín (volitelná úprava)"
              value={nextDueOn}
              onChange={setNextDueOn}
            />
            <MaintenanceDocumentPicker
              selected={documentIds}
              onChange={setDocumentIds}
            />
            <MaintenanceTransactionPicker
              selected={transactionIds}
              onChange={setTransactionIds}
            />
          </>
        ) : null}
        {action !== 'reschedule' ? (
          <Textarea
            label={action === 'skip' ? 'Důvod (volitelný)' : 'Poznámka'}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        ) : null}
        {mutation.isError ? (
          <InlineAlert variant="danger">{mutation.error.message}</InlineAlert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {action === 'complete'
              ? 'Dokončit'
              : action === 'skip'
                ? 'Přeskočit'
                : 'Přeplánovat'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
