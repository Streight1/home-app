import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
import { trim } from '../../../finance/presentation/dto/finance-dto.helpers.js';

export const categorizationFields = [
  'COUNTERPARTY_NAME',
  'COUNTERPARTY_ACCOUNT',
  'DESCRIPTION',
  'VARIABLE_SYMBOL',
] as const;
export const categorizationOperators = [
  'EQUALS',
  'CONTAINS',
  'STARTS_WITH',
] as const;
const categorizableTypes = ['EXPENSE', 'INCOME', 'REFUND'] as const;

export class CreateCategorizationRuleDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  @IsInt()
  @Min(-10_000)
  @Max(10_000)
  public priority!: number;

  @IsBoolean()
  public enabled!: boolean;

  @IsIn(categorizationFields)
  public field!: (typeof categorizationFields)[number];

  @IsIn(categorizationOperators)
  public operator!: (typeof categorizationOperators)[number];

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  public comparisonValue!: string;

  @IsUUID('4')
  public categoryId!: string;

  @IsOptional()
  @IsUUID('4')
  public accountId?: string | null;

  @IsOptional()
  @IsIn(categorizableTypes)
  public transactionType?: (typeof categorizableTypes)[number] | null;
}

export class UpdateCategorizationRuleDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name?: string;

  @IsOptional()
  @IsInt()
  @Min(-10_000)
  @Max(10_000)
  public priority?: number;

  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;

  @IsOptional()
  @IsIn(categorizationFields)
  public field?: (typeof categorizationFields)[number];

  @IsOptional()
  @IsIn(categorizationOperators)
  public operator?: (typeof categorizationOperators)[number];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  public comparisonValue?: string;

  @IsOptional()
  @IsUUID('4')
  public categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  public accountId?: string | null;

  @IsOptional()
  @IsIn(categorizableTypes)
  public transactionType?: (typeof categorizableTypes)[number] | null;
}

export class BulkCategorizeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1_000)
  @IsUUID('4', { each: true })
  public transactionIds!: string[];

  @IsUUID('4')
  public categoryId!: string;
}
