import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MINOR_UNITS_PATTERN } from '../../../finance/presentation/dto/finance-dto.helpers.js';

export class ListInsightsQueryDto {
  @IsOptional()
  @IsIn(['NEW', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED'])
  public status?: 'NEW' | 'ACKNOWLEDGED' | 'DISMISSED' | 'RESOLVED';
  @IsOptional() @IsIn(['CZK', 'EUR']) public currencyCode?: 'CZK' | 'EUR';
}

export class RefreshInsightsDto {
  @IsOptional() @IsIn(['CZK', 'EUR']) public currencyCode: 'CZK' | 'EUR' =
    'CZK';
}

export class ListRecurringQueryDto {
  @IsOptional() @IsIn(['CZK', 'EUR']) public currencyCode?: 'CZK' | 'EUR';
}

export class UpdateRecurringExpenseDto {
  @IsOptional() @IsString() @Length(1, 160) public name?: string;
  @IsOptional()
  @Matches(MINOR_UNITS_PATTERN)
  public expectedAmountMinor?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  public amountTolerancePercent?: number;
  @IsOptional() @IsIn(['ACTIVE', 'PAUSED', 'ENDED']) public status?:
    | 'ACTIVE'
    | 'PAUSED'
    | 'ENDED';
}
