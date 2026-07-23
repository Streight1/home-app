import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ImportPreviewQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page = 1;

  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100])
  public pageSize: 10 | 20 | 50 | 100 = 20;

  @IsOptional()
  @IsIn([
    'VALID',
    'INVALID',
    'POSSIBLE_DUPLICATE',
    'NEEDS_TRANSFER_REVIEW',
    'IMPORTED',
    'SKIPPED',
  ])
  public status?:
    | 'VALID'
    | 'INVALID'
    | 'POSSIBLE_DUPLICATE'
    | 'NEEDS_TRANSFER_REVIEW'
    | 'IMPORTED'
    | 'SKIPPED';
}

export class ListImportHistoryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public pageSize = 20;
}
