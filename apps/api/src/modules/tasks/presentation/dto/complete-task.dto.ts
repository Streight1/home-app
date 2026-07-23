import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteTaskDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() ? value.trim() : null,
  )
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  public note?: string | null;
}
