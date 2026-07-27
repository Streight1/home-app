import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
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

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title?: string;
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public description?: string | null;
  @IsOptional()
  @IsIn(calendarEventTypes)
  public type?: (typeof calendarEventTypes)[number];
  @IsOptional()
  @IsISO8601({ strict: true })
  public startsAt?: string | null;
  @IsOptional()
  @IsISO8601({ strict: true })
  public endsAt?: string | null;
  @IsOptional()
  @IsDateString()
  public allDayStartDate?: string | null;
  @IsOptional()
  @IsDateString()
  public allDayEndDateExclusive?: string | null;
  @IsOptional()
  @IsISO8601({ strict: true })
  public desiredArrivalAt?: string | null;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone?: string;
  @IsOptional()
  @IsBoolean()
  public isAllDay?: boolean;
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
  public calculateTravel?: boolean;
  @IsOptional()
  @IsIn(calendarColorTokens)
  public colorToken?: (typeof calendarColorTokens)[number] | null;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantIds?: string[];
  @IsOptional()
  @IsBoolean()
  public allowShiftConflict = false;
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertTravelPlanDto)
  public travelPlan?: UpsertTravelPlanDto;
}
