import { IsBoolean, IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import {
  financeImportDateFormats,
  financeImportEncodings,
} from '../../domain/finance-import.types.js';

export class ConfigureImportFormatDto {
  @IsIn(financeImportEncodings)
  public encoding!: 'utf-8' | 'windows-1250';

  @IsIn([',', ';', '\t'])
  public delimiter!: ',' | ';' | '\t';

  @IsString()
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
}
