import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  taskCategoryColorTokens,
  type TaskCategoryColorToken,
} from '../../domain/ports/task-category.repository.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTaskCategoryDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;

  @IsIn(taskCategoryColorTokens)
  public colorToken!: TaskCategoryColorToken;
}

export class UpdateTaskCategoryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name?: string;

  @IsOptional()
  @IsIn(taskCategoryColorTokens)
  public colorToken?: TaskCategoryColorToken;
}
