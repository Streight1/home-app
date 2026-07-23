import type {
  CalendarEventRecord,
  CalendarEventWriteInput,
  CalendarTemplateRecord,
  CalendarTemplateWriteInput,
} from '../calendar.types.js';

export const CALENDAR_TEMPLATE_REPOSITORY = Symbol(
  'CALENDAR_TEMPLATE_REPOSITORY',
);

export interface CalendarTemplateRepository {
  list(householdId: string): Promise<CalendarTemplateRecord[]>;
  findById(
    householdId: string,
    templateId: string,
  ): Promise<CalendarTemplateRecord | null>;
  create(input: {
    householdId: string;
    userId: string;
    template: CalendarTemplateWriteInput;
  }): Promise<CalendarTemplateRecord>;
  update(input: {
    householdId: string;
    userId: string;
    templateId: string;
    template: CalendarTemplateWriteInput;
  }): Promise<CalendarTemplateRecord | null>;
  delete(input: {
    householdId: string;
    userId: string;
    templateId: string;
  }): Promise<boolean>;
  apply(input: {
    householdId: string;
    userId: string;
    templateId: string;
    events: CalendarEventWriteInput[];
  }): Promise<{ batchId: string; events: CalendarEventRecord[] }>;
  revert(input: {
    householdId: string;
    userId: string;
    batchId: string;
    now: Date;
  }): Promise<boolean>;
}
