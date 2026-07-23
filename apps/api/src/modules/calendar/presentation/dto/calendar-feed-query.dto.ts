import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CalendarFeedQueryDto {
  @IsISO8601({ strict: true })
  public from!: string;
  @IsISO8601({ strict: true })
  public to!: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone = 'Europe/Prague';
}

export class CalendarDashboardQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone = 'Europe/Prague';
}
