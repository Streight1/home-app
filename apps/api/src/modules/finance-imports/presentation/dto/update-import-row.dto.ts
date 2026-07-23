import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class UpdateImportRowDto {
  @IsOptional()
  @IsBoolean()
  public userIncluded?: boolean;

  @IsOptional()
  @IsUUID('4')
  public categoryId?: string | null;

  @IsOptional()
  @IsIn(['EXPENSE', 'INCOME', 'REFUND', 'TRANSFER_IN'])
  public transactionType?: 'EXPENSE' | 'INCOME' | 'REFUND' | 'TRANSFER_IN';

  @IsOptional()
  @IsUUID('4')
  public transferSourceAccountId?: string | null;

  @IsOptional()
  @IsUUID('4')
  public matchingTransactionId?: string | null;
}

export class BulkImportRowCategoryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1_000)
  @IsUUID('4', { each: true })
  public rowIds!: string[];

  @IsUUID('4')
  public categoryId!: string;
}
