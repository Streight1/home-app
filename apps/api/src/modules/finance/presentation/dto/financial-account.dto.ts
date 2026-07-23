import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';
import {
  financeColorTokens,
  financeCurrencies,
  financeIconKeys,
  financialAccountTypes,
  type FinanceColorToken,
  type FinanceCurrency,
  type FinanceIconKey,
  type FinancialAccountType,
} from '../../domain/finance.types.js';
import {
  ISO_DATE_PATTERN,
  MINOR_UNITS_PATTERN,
  nullableText,
  trim,
} from './finance-dto.helpers.js';

export class CreateFinancialAccountDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  @IsIn(financialAccountTypes)
  public type!: FinancialAccountType;

  @IsIn(financeCurrencies)
  public currencyCode!: FinanceCurrency;

  @IsString()
  @Matches(MINOR_UNITS_PATTERN)
  public openingBalanceMinor!: string;

  @IsString()
  @Matches(ISO_DATE_PATTERN)
  public openingBalanceDate!: string;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;

  @IsIn(financeColorTokens)
  public colorToken!: FinanceColorToken;

  @IsIn(financeIconKeys)
  public iconKey!: FinanceIconKey;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  public creditLimitMinor?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public statementDayOfMonth?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public paymentDueDayOfMonth?: number | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Matches(/^(?:••••|\*{4}) [0-9]{4}$/)
  public maskedIdentifier?: string | null;
}

export class UpdateFinancialAccountDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name?: string;

  @IsOptional()
  @IsIn(financialAccountTypes)
  public type?: FinancialAccountType;

  @IsOptional()
  @IsIn(financeCurrencies)
  public currencyCode?: FinanceCurrency;

  @IsOptional()
  @IsString()
  @Matches(MINOR_UNITS_PATTERN)
  public openingBalanceMinor?: string;

  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_PATTERN)
  public openingBalanceDate?: string;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;

  @IsOptional()
  @IsIn(financeColorTokens)
  public colorToken?: FinanceColorToken;

  @IsOptional()
  @IsIn(financeIconKeys)
  public iconKey?: FinanceIconKey;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  public creditLimitMinor?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public statementDayOfMonth?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public paymentDueDayOfMonth?: number | null;

  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Matches(/^(?:••••|\*{4}) [0-9]{4}$/)
  public maskedIdentifier?: string | null;
}
