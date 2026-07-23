import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  travelRouteModes,
  type TravelRouteMode,
} from '../../../location/travel-estimation.facade.js';

export class SuggestTaskSlotsDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  public date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  public earliestTime = '06:00';

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  public latestTime = '22:00';

  @IsString()
  public timezone = 'Europe/Prague';

  @IsIn(travelRouteModes)
  public routeMode: TravelRouteMode = 'CAR_FAST_TRAFFIC';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(180)
  public travelBufferMinutes = 10;

  @IsBoolean()
  public considerTravel = true;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  public suggestionCount = 5;
}
