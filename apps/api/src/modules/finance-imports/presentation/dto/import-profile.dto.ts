import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trim } from '../../../finance/presentation/dto/finance-dto.helpers.js';
import {
  financeAmountColumnModes,
  financeImportDateFormats,
  financeImportEncodings,
  type FinanceImportColumnMapping,
} from '../../domain/finance-import.types.js';

export class CreateImportProfileDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  @IsOptional()
  @IsUUID('4')
  public accountId?: string | null;

  @IsIn(['BANK_ACCOUNT', 'CREDIT_CARD'])
  public sourceKind!: 'BANK_ACCOUNT' | 'CREDIT_CARD';

  @IsIn(financeImportEncodings)
  public encoding!: 'utf-8' | 'windows-1250';

  @IsIn([',', ';', '\t'])
  public delimiter!: ',' | ';' | '\t';

  @IsIn(['"'])
  public quoteCharacter!: '"';

  @IsBoolean()
  public hasHeader!: boolean;

  @IsInt()
  @Min(1)
  @Max(100)
  public headerRowNumber!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  public skipRowsBefore!: number;

  @IsIn(financeImportDateFormats)
  public dateFormat!: (typeof financeImportDateFormats)[number];

  @IsIn([',', '.'])
  public decimalSeparator!: ',' | '.';

  @IsIn(['', ' ', '.', ','])
  public thousandSeparator!: '' | ' ' | '.' | ',';

  @IsIn(financeAmountColumnModes)
  public amountColumnMode!: (typeof financeAmountColumnModes)[number];

  @IsObject()
  public columnMapping!: FinanceImportColumnMapping;

  @IsBoolean()
  public invertAmountSign!: boolean;

  @IsOptional()
  @IsIn(['CZK', 'EUR'])
  public defaultCurrencyCode?: 'CZK' | 'EUR' | null;
}

export class UpdateImportProfileDto extends CreateImportProfileDto {}
