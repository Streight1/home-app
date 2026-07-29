import type { MaintenancePlanFormProps } from './MaintenancePlanForm.types.js';
import { MaintenancePlanBasicFields } from './MaintenancePlanBasicFields.js';
import { MaintenancePlanPracticalFields } from './MaintenancePlanPracticalFields.js';
import { MaintenancePlanScheduleFields } from './MaintenancePlanScheduleFields.js';

export function MaintenancePlanForm(props: MaintenancePlanFormProps) {
  const update = (next: Partial<MaintenancePlanFormProps['value']>) =>
    props.onChange({ ...props.value, ...next });
  return (
    <div className="grid gap-5">
      <MaintenancePlanBasicFields {...props} update={update} />
      <MaintenancePlanScheduleFields {...props} update={update} />
      <MaintenancePlanPracticalFields {...props} update={update} />
    </div>
  );
}
