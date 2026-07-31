import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  documentSortFields,
  documentStatuses,
  sortDirections,
  type DocumentSortField,
  type DocumentStatus,
  type SortDirection,
} from '../../domain/document-status.js';
import {
  documentTypeKeys,
  type DocumentTypeKey,
} from '../../domain/metadata/document-type.js';

const pageSizes = [10, 20, 50, 100] as const;

export class ListDocumentsQueryDto {
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
  @ValidateIf((value: ListDocumentsQueryDto) => value.folderId !== 'root')
  @IsUUID('4')
  public folderId?: string;

  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  public includeSubfolders = false;

  @IsOptional()
  @IsIn(documentTypeKeys)
  public type?: DocumentTypeKey;

  @IsOptional()
  @IsIn(documentStatuses)
  public status: DocumentStatus = 'ACTIVE';

  @IsOptional()
  @IsDateOnly()
  public createdFrom?: string;

  @IsOptional()
  @IsDateOnly()
  public createdTo?: string;

  @IsOptional()
  @IsIn(documentSortFields)
  public sortBy: DocumentSortField = 'createdAt';

  @IsOptional()
  @IsIn(sortDirections)
  public sortDirection: SortDirection = 'desc';
}
