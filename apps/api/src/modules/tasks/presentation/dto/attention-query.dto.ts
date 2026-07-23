import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AttentionQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone = 'Europe/Prague';
}
