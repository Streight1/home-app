import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import { MINOR_UNITS_PATTERN } from '../../../finance/presentation/dto/finance-dto.helpers.js';

export class BudgetAllocationDto {
  @IsUUID('4') public categoryId!: string;
  @Matches(MINOR_UNITS_PATTERN) public limitMinor!: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) public warningThresholdPercent = 80;
}

export class CreateBudgetDto {
  @IsString() @Length(1, 120) public name!: string;
  @IsIn(['CZK', 'EUR']) public currencyCode!: 'CZK' | 'EUR';
  @IsIn(['MONTHLY', 'CUSTOM']) public periodType!: 'MONTHLY' | 'CUSTOM';
  @IsDateOnly() public periodStart!: string;
  @IsDateOnly() public periodEnd!: string;
  @IsOptional() @Matches(MINOR_UNITS_PATTERN) public totalLimitMinor?: string;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE']) public status: 'DRAFT' | 'ACTIVE' =
    'DRAFT';
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BudgetAllocationDto)
  public allocations: BudgetAllocationDto[] = [];
}

export class UpdateBudgetDto {
  @IsOptional() @IsString() @Length(1, 120) public name?: string;
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Matches(MINOR_UNITS_PATTERN)
  public totalLimitMinor?: string | null;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'CLOSED']) public status?:
    | 'DRAFT'
    | 'ACTIVE'
    | 'CLOSED';
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BudgetAllocationDto)
  public allocations?: BudgetAllocationDto[];
}

export class CopyBudgetDto {
  @IsDateOnly() public targetMonth!: string;
  @IsOptional() @IsString() @Length(1, 120) public name?: string;
}

export class ListBudgetsQueryDto {
  @IsOptional() @IsIn(['CZK', 'EUR']) public currencyCode?: 'CZK' | 'EUR';
  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'])
  public status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
}
