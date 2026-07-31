import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import { MINOR_UNITS_PATTERN, nullableText } from './finance-dto.helpers.js';

export class CreateFinancialTransferDto {
  @IsUUID('4') public fromAccountId!: string;
  @IsUUID('4') public toAccountId!: string;
  @IsString() @Matches(MINOR_UNITS_PATTERN) public amountMinor!: string;
  @IsString() @IsDateOnly() public bookedDate!: string;
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public note?: string | null;
}

export class UpdateFinancialTransferDto extends CreateFinancialTransferDto {}
