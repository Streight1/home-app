import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateFolderDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;
  @IsOptional()
  @IsUUID('4')
  public parentId?: string | null;
}
export class RenameFolderDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;
}
export class MoveFolderDto {
  @IsOptional()
  @IsUUID('4')
  public parentId?: string | null;
}
export class MoveDocumentDto {
  @IsOptional()
  @IsUUID('4')
  public folderId?: string | null;
}
