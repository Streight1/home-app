import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { financeAmountColumnModes } from '../../domain/finance-import.types.js';
import type { FinanceImportColumnMapping } from '../../domain/finance-import.types.js';

export class ConfigureImportMappingDto {
  @IsIn(financeAmountColumnModes)
  public amountColumnMode!: (typeof financeAmountColumnModes)[number];

  @IsObject()
  public columnMapping!: FinanceImportColumnMapping;

  @IsBoolean()
  public invertAmountSign!: boolean;

  @IsOptional()
  @IsIn(['CZK', 'EUR'])
  public defaultCurrencyCode?: 'CZK' | 'EUR' | null;

  @IsOptional()
  @IsUUID('4')
  public profileId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public saveProfileName?: string;
}
