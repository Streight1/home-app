import { IsIn, IsUUID } from 'class-validator';

export class CreateImportSessionDto {
  @IsUUID('4')
  public accountId!: string;

  @IsIn(['BANK_ACCOUNT', 'CREDIT_CARD'])
  public sourceKind!: 'BANK_ACCOUNT' | 'CREDIT_CARD';
}
