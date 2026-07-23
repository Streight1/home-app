import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import {
  taskPriorities,
  recurrenceFrequencies,
  type TaskPriority,
  type RecurrenceFrequency,
} from '../../domain/task-status.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const nullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : trim({ value });

export class CreateTaskDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title!: string;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  public description?: string | null;

  @IsOptional()
  @IsIn(taskPriorities)
  public priority: TaskPriority = 'NORMAL';

  @IsOptional()
  @IsUUID('4')
  public assignedToUserId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  public participantUserIds?: string[];

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1_440)
  public estimatedDurationMinutes?: number | null;

  @IsOptional()
  @IsUUID('4')
  public locationPlaceId?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  public locationLabel?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public locationNotes?: string | null;

  @IsOptional()
  @IsUUID('4')
  public categoryId?: string | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public dueDate?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_439)
  public dueTimeMinutes?: number | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone = 'Europe/Prague';

  @IsOptional()
  @IsIn(recurrenceFrequencies)
  public recurrenceFrequency: RecurrenceFrequency = 'NONE';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  public recurrenceInterval = 1;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  public recurrenceDaysOfWeek: number[] = [];

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public recurrenceDayOfMonth?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  public recurrenceMonthOfYear?: number | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  public recurrenceEndsAt?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public documentIds: string[] = [];
}
