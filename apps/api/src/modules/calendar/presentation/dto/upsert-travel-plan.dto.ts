import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { routeModes } from '../../../location/domain/location.types.js';

export class UpsertTravelPlanDto {
  @IsUUID('4') public travelerUserId!: string;
  @IsIn(['AUTO', 'DEFAULT_PLACE', 'PREVIOUS_EVENT', 'CUSTOM_PLACE'])
  public originMode!:
    | 'AUTO'
    | 'DEFAULT_PLACE'
    | 'PREVIOUS_EVENT'
    | 'CUSTOM_PLACE';
  @ValidateIf(
    (value: UpsertTravelPlanDto) => value.originMode === 'CUSTOM_PLACE',
  )
  @IsUUID('4')
  public originPlaceId?: string | null;
  @ValidateIf(
    (value: UpsertTravelPlanDto) => value.originMode === 'PREVIOUS_EVENT',
  )
  @IsUUID('4')
  public previousEventId?: string | null;
  @IsIn(routeModes) public routeMode!: (typeof routeModes)[number];
  @IsBoolean() public avoidTolls!: boolean;
  @IsBoolean() public avoidHighways!: boolean;
  @IsInt() @Min(0) @Max(240) public travelBufferMinutes!: number;
  @IsOptional() @IsBoolean() public allowTravelConflict = false;
}
