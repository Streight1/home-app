import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import {
  Dialog,
  DialogClose,
} from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useCurrentUser } from '../../../auth/hooks/useCurrentUser.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import {
  useMaintenanceCategories,
  useMaintenanceMutations,
} from '../../hooks/useMaintenance.js';
import { localIsoDate } from '../../lib/maintenanceFormat.js';
import type {
  MaintenancePlan,
  MaintenancePlanInput,
} from '../../types/maintenance.types.js';
import { MaintenancePlanForm } from '../forms/MaintenancePlanForm.js';

function initialValue(responsibleUserId: string | null): MaintenancePlanInput {
  return {
    title: '',
    description: null,
    instructions: null,
    priority: 'NORMAL',
    categoryId: null,
    recurrence: { frequency: 'ONCE', interval: 1 },
    recurrenceBasis: 'FROM_SCHEDULED_DATE',
    startsOn: localIsoDate(),
    endsOn: null,
    leadDays: 7,
    estimatedDurationMinutes: null,
    preferredStartTime: null,
    responsibleUserId,
    locationLabel: null,
    providerName: null,
    defaultCostMinor: null,
    defaultCurrencyCode: null,
    autoCreateTask: true,
    taskCreateDaysBefore: 7,
  };
}

function planValue(plan: MaintenancePlan): MaintenancePlanInput {
  return {
    title: plan.title,
    description: plan.description,
    instructions: plan.instructions,
    priority: plan.priority,
    categoryId: plan.category?.id ?? null,
    recurrence: plan.recurrence,
    recurrenceBasis: plan.recurrenceBasis,
    startsOn: plan.startsOn,
    endsOn: plan.endsOn,
    leadDays: plan.leadDays,
    estimatedDurationMinutes: plan.estimatedDurationMinutes,
    preferredStartTime: plan.preferredStartTime,
    responsibleUserId: plan.responsible?.id ?? null,
    locationLabel: plan.locationLabel,
    providerName: plan.providerName,
    defaultCostMinor: plan.defaultCost?.amountMinor ?? null,
    defaultCurrencyCode: plan.defaultCost?.currencyCode ?? null,
    autoCreateTask: plan.autoCreateTask,
    taskCreateDaysBefore: plan.taskCreateDaysBefore,
  };
}

export function MaintenancePlanDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: MaintenancePlan;
}) {
  const user = useCurrentUser();
  const members = useHouseholdMembers();
  const categories = useMaintenanceCategories();
  const mutations = useMaintenanceMutations();
  const [value, setValue] = useState(() =>
    plan ? planValue(plan) : initialValue(null),
  );
  useEffect(() => {
    if (open && plan) setValue(planValue(plan));
  }, [open, plan]);
  useEffect(() => {
    if (open && !plan && user.data?.user.id)
      setValue((current) => ({
        ...current,
        responsibleUserId: current.responsibleUserId ?? user.data.user.id,
      }));
  }, [open, plan, user.data?.user.id]);
  const close = () => {
    setValue(plan ? planValue(plan) : initialValue(user.data?.user.id ?? null));
    mutations.createPlan.reset();
    mutations.updatePlan.reset();
    onOpenChange(false);
  };
  const mutation = plan ? mutations.updatePlan : mutations.createPlan;
  return (
    <Dialog
      title={plan ? 'Upravit plán údržby' : 'Nový plán údržby'}
      description={
        plan
          ? plan.title
          : 'Naplánujte jednorázovou nebo pravidelnou péči o domácnost.'
      }
      size="lg"
      mobileFullScreen
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && close()}
    >
      <form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (plan)
            mutations.updatePlan.mutate(
              { planId: plan.id, input: value },
              { onSuccess: close },
            );
          else mutations.createPlan.mutate(value, { onSuccess: close });
        }}
      >
        <MaintenancePlanForm
          value={value}
          categories={categories.data?.items ?? []}
          members={members.data ?? []}
          onChange={setValue}
        />
        {mutation.isError ? (
          <InlineAlert variant="danger">{mutation.error.message}</InlineAlert>
        ) : null}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-surface-raised py-3">
          <DialogClose asChild>
            <Button type="button">Zrušit</Button>
          </DialogClose>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
            disabled={!value.title.trim() || !value.startsOn}
          >
            {plan ? 'Uložit změny' : 'Vytvořit plán'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
