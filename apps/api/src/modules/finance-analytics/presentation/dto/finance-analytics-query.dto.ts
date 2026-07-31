import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';

const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;
const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class FinanceAnalyticsQueryDto {
  @IsOptional() @IsDateOnly() public dateFrom?: string;
  @IsOptional() @IsDateOnly() public dateTo?: string;
  @Transform(toArray)
  @IsOptional()
  @IsUUID('4', { each: true })
  public accountIds?: string[];
  @Transform(toArray)
  @IsOptional()
  @IsUUID('4', { each: true })
  public categoryIds?: string[];
  @IsOptional() @IsIn(['CZK', 'EUR']) public currencyCode?: 'CZK' | 'EUR';
  @Transform(toBoolean) @IsOptional() @IsBoolean() public includeCreditCards =
    true;
}
