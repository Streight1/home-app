import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { routeModes } from '../../../location/domain/location.types.js';
import {
  calendarColorTokens,
  calendarEventTypes,
} from '../../domain/calendar.types.js';

export class CalendarTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title!: string;
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public description?: string | null;
  @IsIn(calendarEventTypes)
  public eventType!: (typeof calendarEventTypes)[number];
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  public startLocalTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  public endLocalTime!: string;
  @IsInt()
  @Min(0)
  @Max(7)
  public endDayOffset!: number;
  @IsString()
  @MaxLength(100)
  public timezone!: string;
  @IsBoolean()
  public isAllDay!: boolean;
  @IsOptional()
  @IsString()
  @MaxLength(300)
  public defaultLocation?: string | null;
  @IsOptional()
  @IsUUID('4')
  public locationPlaceId?: string | null;
  @IsOptional()
  @IsString()
  @MaxLength(300)
  public locationLabel?: string | null;
  @IsOptional()
  @IsBoolean()
  public calculateTravel = true;
  @IsIn(routeModes)
  public routeMode: (typeof routeModes)[number] = 'CAR_FAST_TRAFFIC';
  @IsInt()
  @Min(0)
  @Max(240)
  public travelBufferMinutes = 10;
  @IsIn(calendarColorTokens)
  public colorToken!: (typeof calendarColorTokens)[number];
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantIds!: string[];
}

export class ApplyCalendarTemplateDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public date!: string;
  @IsOptional()
  @IsBoolean()
  public allowShiftConflicts = false;
}

export class BulkApplyCalendarTemplateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @ArrayMaxSize(62)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  public dates!: string[];
  @IsOptional()
  @IsBoolean()
  public allowShiftConflicts = false;
}
