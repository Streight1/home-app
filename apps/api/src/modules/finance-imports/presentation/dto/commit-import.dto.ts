import { IsBoolean } from 'class-validator';

export class CommitImportDto {
  @IsBoolean()
  public confirmPossibleDuplicates = false;

  @IsBoolean()
  public confirmRepeatedFile = false;
}
