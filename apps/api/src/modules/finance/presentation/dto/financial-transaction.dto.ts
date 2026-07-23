import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  MINOR_UNITS_PATTERN,
  nullableText,
} from './finance-dto.helpers.js';

export class CreateFinancialTransactionDto {
  @IsUUID('4') public accountId!: string;
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsString() @Matches(MINOR_UNITS_PATTERN) public amountMinor!: string;
  @IsString() @Matches(ISO_DATE_PATTERN) public bookedDate!: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public counterpartyName?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public counterpartyAccount?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public variableSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public constantSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public specificSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public note?: string | null;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public documentIds: string[] = [];
}

export class UpdateFinancialTransactionDto {
  @IsOptional() @IsUUID('4') public accountId?: string;
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsOptional()
  @IsString()
  @Matches(MINOR_UNITS_PATTERN)
  public amountMinor?: string;
  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_PATTERN)
  public bookedDate?: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public counterpartyName?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public counterpartyAccount?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public variableSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public constantSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  public specificSymbol?: string | null;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public note?: string | null;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public documentIds?: string[];
}

export class UpdateFinancialTransactionDocumentsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public documentIds!: string[];
}
