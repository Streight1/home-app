import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  financePageSizes,
  financeSortDirections,
  financialTransactionTypes,
} from '../../domain/finance.types.js';
import { MINOR_UNITS_PATTERN } from './finance-dto.helpers.js';

const transactionSortFields = [
  'bookedDate',
  'amountMinor',
  'createdAt',
  'counterpartyName',
] as const;

export class ListFinancialTransactionsDto {
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) public page = 1;
  @Type(() => Number)
  @IsOptional()
  @IsIn(financePageSizes)
  public pageSize: 10 | 20 | 50 | 100 = 20;
  @IsOptional() @IsString() @MaxLength(200) public query?: string;
  @IsOptional() @IsUUID('4') public accountId?: string;
  @IsOptional() @IsUUID('4') public categoryId?: string;
  @IsOptional()
  @IsIn(financialTransactionTypes)
  public type?: (typeof financialTransactionTypes)[number];
  @IsOptional() @IsDateOnly() public dateFrom?: string;
  @IsOptional() @IsDateOnly() public dateTo?: string;
  @IsOptional() @Matches(MINOR_UNITS_PATTERN) public amountFromMinor?: string;
  @IsOptional() @Matches(MINOR_UNITS_PATTERN) public amountToMinor?: string;
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  public documentLinked?: boolean;
  @IsOptional()
  @IsIn(transactionSortFields)
  public sortBy: (typeof transactionSortFields)[number] = 'bookedDate';
  @IsOptional()
  @IsIn(financeSortDirections)
  public sortDirection: 'asc' | 'desc' = 'desc';
}

export class FinancePeriodDto {
  @IsOptional() @IsDateOnly() public dateFrom?: string;
  @IsOptional() @IsDateOnly() public dateTo?: string;
}
