import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestPlacesQueryDto {
  @IsString()
  @MaxLength(150)
  public query!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public types = 'regional,poi';
}
