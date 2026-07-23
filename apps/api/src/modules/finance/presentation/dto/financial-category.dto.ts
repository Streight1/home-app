import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  financeColorTokens,
  financeIconKeys,
  financialCategoryKinds,
  type FinanceColorToken,
  type FinanceIconKey,
  type FinancialCategoryKind,
} from '../../domain/finance.types.js';
import { trim } from './finance-dto.helpers.js';

export class CreateFinancialCategoryDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;

  @IsIn(financialCategoryKinds)
  public kind!: FinancialCategoryKind;

  @IsOptional()
  @IsUUID('4')
  public parentId?: string | null;

  @IsIn(financeColorTokens)
  public colorToken!: FinanceColorToken;

  @IsIn(financeIconKeys)
  public iconKey!: FinanceIconKey;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  public sortOrder = 0;
}

export class UpdateFinancialCategoryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name?: string;

  @IsOptional()
  @IsIn(financialCategoryKinds)
  public kind?: FinancialCategoryKind;

  @IsOptional()
  @IsUUID('4')
  public parentId?: string | null;

  @IsOptional()
  @IsIn(financeColorTokens)
  public colorToken?: FinanceColorToken;

  @IsOptional()
  @IsIn(financeIconKeys)
  public iconKey?: FinanceIconKey;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  public sortOrder?: number;
}
