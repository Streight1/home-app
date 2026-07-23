import { Transform } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  documentTypeKeys,
  type DocumentTypeKey,
} from '../../domain/metadata/document-type.js';

const isoDatePattern = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const optionalText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === ''
    ? undefined
    : trim({ value });
const parseMetadata = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export class CreateDocumentDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title!: string;

  @Transform(optionalText)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  public description?: string;

  @Transform(optionalText)
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  public notes?: string;

  @IsIn(documentTypeKeys)
  public documentType: DocumentTypeKey = 'GENERAL';

  @Transform(optionalText)
  @IsOptional()
  @IsUUID('4')
  public folderId?: string;

  @Transform(parseMetadata)
  @IsObject()
  public metadata: Record<string, unknown> = {};

  @Transform(optionalText)
  @IsOptional()
  @Matches(isoDatePattern)
  public documentDate?: string;
}
