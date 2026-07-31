import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  MAINTENANCE_COLOR_TOKENS,
  MAINTENANCE_ICON_KEYS,
  MAINTENANCE_OCCURRENCE_STATUSES,
  MAINTENANCE_PLAN_STATUSES,
  MAINTENANCE_PRIORITIES,
  type MaintenanceOccurrenceStatus,
  type MaintenancePlanStatus,
  type MaintenancePriority,
} from '../../domain/maintenance.types.js';

const nullableText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export const MAINTENANCE_FREQUENCIES = [
  'ONCE',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'CUSTOM_MONTHS',
] as const;

export class MaintenanceRecurrenceDto {
  @IsIn(MAINTENANCE_FREQUENCIES)
  public frequency!: (typeof MAINTENANCE_FREQUENCIES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  public interval = 1;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  public weekdays?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  public dayOfMonth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  public monthOfYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  public months?: number[];

  @IsOptional()
  @IsIn([1, 2, 3, 4, 5, -1])
  public ordinal?: 1 | 2 | 3 | 4 | 5 | -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  public weekday?: number;
}

export class CreateMaintenancePlanDto {
  @IsString() @Length(1, 200) public title!: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  public description?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 10000)
  public instructions?: string | null;
  @IsOptional()
  @IsIn(MAINTENANCE_PRIORITIES)
  public priority: MaintenancePriority = 'NORMAL';
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsObject()
  @ValidateNested()
  @Type(() => MaintenanceRecurrenceDto)
  public recurrence!: MaintenanceRecurrenceDto;
  @IsOptional()
  @IsIn(['FROM_SCHEDULED_DATE', 'FROM_COMPLETION_DATE'])
  public recurrenceBasis: 'FROM_SCHEDULED_DATE' | 'FROM_COMPLETION_DATE' =
    'FROM_SCHEDULED_DATE';
  @IsDateOnly() public startsOn!: string;
  @IsOptional() @IsDateOnly() public endsOn?: string | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  public leadDays = 7;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  public estimatedDurationMinutes?: number | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  public preferredStartTime?: number | null;
  @IsOptional() @IsUUID('4') public responsibleUserId?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 300)
  public locationLabel?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 200)
  public providerName?: string | null;
  @IsOptional()
  @Matches(/^\d+$/)
  public defaultCostMinor?: string | null;
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  public defaultCurrencyCode?: string | null;
  @IsOptional() @IsBoolean() public autoCreateTask = true;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  public taskCreateDaysBefore = 7;
}

export class UpdateMaintenancePlanDto {
  @IsOptional() @IsString() @Length(1, 200) public title?: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  public description?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 10000)
  public instructions?: string | null;
  @IsOptional()
  @IsIn(MAINTENANCE_PRIORITIES)
  public priority?: MaintenancePriority;
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MaintenanceRecurrenceDto)
  public recurrence?: MaintenanceRecurrenceDto;
  @IsOptional()
  @IsIn(['FROM_SCHEDULED_DATE', 'FROM_COMPLETION_DATE'])
  public recurrenceBasis?: 'FROM_SCHEDULED_DATE' | 'FROM_COMPLETION_DATE';
  @IsOptional() @IsDateOnly() public startsOn?: string;
  @IsOptional() @IsDateOnly() public endsOn?: string | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  public leadDays?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  public estimatedDurationMinutes?: number | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  public preferredStartTime?: number | null;
  @IsOptional() @IsUUID('4') public responsibleUserId?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 300)
  public locationLabel?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 200)
  public providerName?: string | null;
  @IsOptional() @Matches(/^\d+$/) public defaultCostMinor?: string | null;
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  public defaultCurrencyCode?: string | null;
  @IsOptional() @IsBoolean() public autoCreateTask?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  public taskCreateDaysBefore?: number;
}

export class ListMaintenancePlansQueryDto {
  @IsOptional() @IsString() @Length(1, 120) public query?: string;
  @IsOptional()
  @IsIn(MAINTENANCE_PLAN_STATUSES)
  public status?: MaintenancePlanStatus;
  @IsOptional()
  @IsIn(MAINTENANCE_PRIORITIES)
  public priority?: MaintenancePriority;
  @IsOptional() @IsUUID('4') public categoryId?: string;
  @IsOptional() @IsUUID('4') public responsibleUserId?: string;
  @IsOptional() @IsDateOnly() public dueFrom?: string;
  @IsOptional() @IsDateOnly() public dueTo?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  public overdueOnly?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  public pausedOnly?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) public page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 20, 50, 100])
  public pageSize: 10 | 20 | 50 | 100 = 20;
  @IsOptional()
  @IsIn(['nextDueOn', 'title', 'priority', 'updatedAt', 'createdAt'])
  public sortBy:
    | 'nextDueOn'
    | 'title'
    | 'priority'
    | 'updatedAt'
    | 'createdAt' = 'nextDueOn';
  @IsOptional()
  @IsIn(['asc', 'desc'])
  public sortDirection: 'asc' | 'desc' = 'asc';
}

export class ListMaintenanceOccurrencesQueryDto {
  @IsOptional() @IsUUID('4') public planId?: string;
  @IsOptional()
  @IsIn(MAINTENANCE_OCCURRENCE_STATUSES)
  public status?: MaintenanceOccurrenceStatus;
  @IsOptional() @IsDateOnly() public from?: string;
  @IsOptional() @IsDateOnly() public to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) public page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 20, 50, 100])
  public pageSize: 10 | 20 | 50 | 100 = 20;
}

export class CompleteMaintenanceOccurrenceDto {
  @IsDateOnly() public completedOn!: string;
  @IsOptional() @IsUUID('4') public completedByUserId?: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  public notes?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 200)
  public providerName?: string | null;
  @IsOptional() @Matches(/^\d+$/) public actualCostMinor?: string | null;
  @IsOptional() @Matches(/^[A-Z]{3}$/) public currencyCode?: string | null;
  @IsOptional() @IsDateOnly() public nextDueOn?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public documentIds: string[] = [];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public transactionIds: string[] = [];
}

export class SkipMaintenanceOccurrenceDto {
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  public reason?: string | null;
}

export class RescheduleMaintenanceOccurrenceDto {
  @IsDateOnly() public scheduledFor!: string;
}

export class SetMaintenanceDocumentsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public documentIds!: string[];
  @IsOptional()
  @IsIn([
    'SERVICE_REPORT',
    'INVOICE',
    'RECEIPT',
    'WARRANTY',
    'MANUAL',
    'PHOTO',
    'OTHER',
  ])
  public relationType:
    | 'SERVICE_REPORT'
    | 'INVOICE'
    | 'RECEIPT'
    | 'WARRANTY'
    | 'MANUAL'
    | 'PHOTO'
    | 'OTHER' = 'OTHER';
}

export class SetMaintenanceTransactionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public transactionIds!: string[];
  @IsOptional()
  @IsIn(['SERVICE_COST', 'MATERIAL', 'INSPECTION_FEE', 'OTHER'])
  public relationType:
    | 'SERVICE_COST'
    | 'MATERIAL'
    | 'INSPECTION_FEE'
    | 'OTHER' = 'OTHER';
}

export class CreateMaintenanceCategoryDto {
  @IsString() @Length(1, 100) public name!: string;
  @IsIn(MAINTENANCE_ICON_KEYS)
  public iconKey!: (typeof MAINTENANCE_ICON_KEYS)[number];
  @IsIn(MAINTENANCE_COLOR_TOKENS)
  public colorToken!: (typeof MAINTENANCE_COLOR_TOKENS)[number];
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  public sortOrder = 0;
}

export class UpdateMaintenanceCategoryDto {
  @IsOptional() @IsString() @Length(1, 100) public name?: string;
  @IsOptional()
  @IsIn(MAINTENANCE_ICON_KEYS)
  public iconKey?: (typeof MAINTENANCE_ICON_KEYS)[number];
  @IsOptional()
  @IsIn(MAINTENANCE_COLOR_TOKENS)
  public colorToken?: (typeof MAINTENANCE_COLOR_TOKENS)[number];
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  public sortOrder?: number;
}

export class MaintenanceCategoriesQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  public includeArchived = false;
}
