import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  taskSortFields,
  taskPriorities,
  taskStatuses,
  taskViews,
  type TaskSortField,
  type TaskPriority,
  type TaskStatus,
  type TaskView,
  type SortDirection,
} from '../../domain/task-status.js';

const pageSizes = [10, 20, 50, 100] as const;

export class ListTasksQueryDto {
  @IsOptional()
  @IsIn(taskViews)
  public view: TaskView = 'all';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  public page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsIn(pageSizes)
  public pageSize: 10 | 20 | 50 | 100 = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public query?: string;

  @IsOptional()
  @IsIn(taskStatuses)
  public status?: TaskStatus;

  @IsOptional()
  @IsIn(taskPriorities)
  public priority?: TaskPriority;

  @IsOptional()
  @IsUUID('4')
  public assignedToUserId?: string;

  @IsOptional()
  @IsUUID('4')
  public categoryId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  public dueFrom?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  public dueTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone = 'Europe/Prague';

  @IsOptional()
  @IsIn(taskSortFields)
  public sortBy?: TaskSortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  public sortDirection?: SortDirection;
}
