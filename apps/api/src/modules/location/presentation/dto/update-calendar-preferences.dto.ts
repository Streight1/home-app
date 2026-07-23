import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  calendarViewPreferences,
  routeModes,
} from '../../domain/location.types.js';

export class UpdateCalendarPreferencesDto {
  @IsOptional() @IsUUID('4') public defaultPlaceId?: string | null;
  @IsOptional()
  @IsIn(routeModes)
  public defaultRouteMode?: (typeof routeModes)[number];
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  public defaultTravelBufferMinutes?: number;
  @IsOptional() @IsBoolean() public avoidTolls?: boolean;
  @IsOptional() @IsBoolean() public avoidHighways?: boolean;
  @IsOptional()
  @IsIn(calendarViewPreferences)
  public compactCalendarView?: (typeof calendarViewPreferences)[number];
  @IsOptional()
  @IsIn(calendarViewPreferences)
  public mediumCalendarView?: (typeof calendarViewPreferences)[number];
  @IsOptional()
  @IsIn(calendarViewPreferences)
  public expandedCalendarView?: (typeof calendarViewPreferences)[number];
  @IsOptional() @IsBoolean() public showTravelBlocks?: boolean;
  @IsOptional()
  @IsUUID('4')
  public lastWorkShiftParticipantUserId?: string | null;
}
