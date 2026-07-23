import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { routeModes } from '../../../location/domain/location.types.js';

export class TravelEstimateDto {
  @IsOptional() @IsUUID('4') public eventId?: string;
  @IsISO8601({ strict: true }) public startsAt!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public participantIds!: string[];
  @IsUUID('4') public destinationPlaceId!: string;
  @IsIn(['AUTO', 'DEFAULT_PLACE', 'PREVIOUS_EVENT', 'CUSTOM_PLACE'])
  public originMode:
    | 'AUTO'
    | 'DEFAULT_PLACE'
    | 'PREVIOUS_EVENT'
    | 'CUSTOM_PLACE' = 'AUTO';
  @ValidateIf((value: TravelEstimateDto) => value.originMode === 'CUSTOM_PLACE')
  @IsUUID('4')
  public originPlaceId?: string | null;
  @ValidateIf(
    (value: TravelEstimateDto) => value.originMode === 'PREVIOUS_EVENT',
  )
  @IsUUID('4')
  public previousEventId?: string | null;
  @IsIn(routeModes)
  public routeMode: (typeof routeModes)[number] = 'CAR_FAST_TRAFFIC';
  @IsBoolean() public avoidTolls = false;
  @IsBoolean() public avoidHighways = false;
  @IsInt() @Min(0) @Max(240) public travelBufferMinutes = 10;
}
