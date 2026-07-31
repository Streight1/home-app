import { Transform } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  documentTypeKeys,
  type DocumentTypeKey,
} from '../../domain/metadata/document-type.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const nullableText = ({ value }: { value: unknown }): unknown =>
  value === null || (typeof value === 'string' && value.trim() === '')
    ? null
    : trim({ value });

export class UpdateDocumentDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title?: string;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  public description?: string | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  public notes?: string | null;

  @IsOptional()
  @IsIn(documentTypeKeys)
  public documentType?: DocumentTypeKey;

  @IsOptional()
  @IsObject()
  public metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateOnly()
  public documentDate?: string | null;
}
