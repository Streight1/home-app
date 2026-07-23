import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import {
  calendarColorTokens,
  calendarEventTypes,
} from '../../domain/calendar.types.js';
import { UpsertTravelPlanDto } from './upsert-travel-plan.dto.js';

export class CreateCalendarEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public description?: string | null;

  @IsIn(calendarEventTypes)
  public type!: (typeof calendarEventTypes)[number];

  @IsISO8601({ strict: true })
  public startsAt!: string;

  @IsISO8601({ strict: true })
  public endsAt!: string;

  @IsString()
  @MaxLength(100)
  public timezone!: string;

  @IsBoolean()
  public isAllDay!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public location?: string | null;

  @IsOptional()
  @IsUUID('4')
  public locationPlaceId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public locationLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  public locationNotes?: string | null;

  @IsOptional()
  @IsBoolean()
  public calculateTravel = true;

  @IsIn(calendarColorTokens)
  public colorToken!: (typeof calendarColorTokens)[number];

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantIds!: string[];

  @IsOptional()
  @IsBoolean()
  public allowShiftConflict = false;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertTravelPlanDto)
  public travelPlan?: UpsertTravelPlanDto;
}
