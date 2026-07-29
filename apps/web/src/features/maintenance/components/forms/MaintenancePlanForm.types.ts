import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import type {
  MaintenanceCategory,
  MaintenancePlanInput,
} from '../../types/maintenance.types.js';

export interface MaintenancePlanFormProps {
  value: MaintenancePlanInput;
  categories: MaintenanceCategory[];
  members: HouseholdMemberSummary[];
  onChange: (value: MaintenancePlanInput) => void;
}

export interface MaintenancePlanFieldProps extends MaintenancePlanFormProps {
  update: (next: Partial<MaintenancePlanInput>) => void;
}
