import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FinanceCatalogQueryDto {
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsOptional()
  @IsBoolean()
  public includeArchived = false;
}
