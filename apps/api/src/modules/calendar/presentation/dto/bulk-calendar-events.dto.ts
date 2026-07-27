import { Type } from 'class-transformer';
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
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { routeModes } from '../../../location/domain/location.types.js';
import {
  calendarColorTokens,
  calendarEventTypes,
} from '../../domain/calendar.types.js';

const operations = ['UNCHANGED', 'SET', 'REMOVE'] as const;
const setOperations = ['UNCHANGED', 'SET'] as const;
const participantOperations = [
  'UNCHANGED',
  'ADD',
  'REMOVE',
  'REPLACE',
] as const;

export class CalendarBulkSelectionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public eventIds!: string[];
}

export class BulkUpdateCalendarEventsDto extends CalendarBulkSelectionDto {
  @IsOptional()
  @IsIn(operations)
  public colorOperation: (typeof operations)[number] = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) => value.colorOperation === 'SET',
  )
  @IsIn(calendarColorTokens)
  public colorToken?: (typeof calendarColorTokens)[number];

  @IsOptional()
  @IsIn(setOperations)
  public typeOperation: (typeof setOperations)[number] = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) => value.typeOperation === 'SET',
  )
  @IsIn(calendarEventTypes)
  public eventType?: (typeof calendarEventTypes)[number];

  @IsOptional()
  @IsIn(participantOperations)
  public participantOperation: (typeof participantOperations)[number] =
    'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) =>
      value.participantOperation !== 'UNCHANGED',
  )
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public participantIds?: string[];

  @IsOptional()
  @IsIn(operations)
  public locationOperation: (typeof operations)[number] = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) => value.locationOperation === 'SET',
  )
  @IsUUID('4')
  public locationPlaceId?: string;

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) => value.locationOperation === 'SET',
  )
  @IsString()
  @MaxLength(300)
  public locationLabel?: string;

  @IsOptional()
  @IsIn(['UNCHANGED', 'SET'])
  public calculateTravelOperation: 'UNCHANGED' | 'SET' = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) =>
      value.calculateTravelOperation === 'SET',
  )
  @IsBoolean()
  public calculateTravel?: boolean;

  @IsOptional()
  @IsIn(['UNCHANGED', 'SET'])
  public routeModeOperation: 'UNCHANGED' | 'SET' = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) => value.routeModeOperation === 'SET',
  )
  @IsIn(routeModes)
  public routeMode?: (typeof routeModes)[number];

  @IsOptional()
  @IsIn(['UNCHANGED', 'SET'])
  public travelBufferOperation: 'UNCHANGED' | 'SET' = 'UNCHANGED';

  @ValidateIf(
    (value: BulkUpdateCalendarEventsDto) =>
      value.travelBufferOperation === 'SET',
  )
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  public travelBufferMinutes?: number;
}

export class BulkDeleteCalendarEventsDto extends CalendarBulkSelectionDto {
  @IsString()
  @IsIn(['SMAZAT'])
  public confirmation!: 'SMAZAT';
}
