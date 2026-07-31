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
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DATE_ONLY_PATTERN,
  DECIMAL_QUANTITY_PATTERN,
  EXPEDITION_TRIP_TYPES,
  GEAR_CRITICALITIES,
  GEAR_LOAD_TYPES,
  GEAR_PACKING_STATUSES,
  GEAR_REVIEW_OUTCOMES,
} from '../../domain/expeditions.types.js';

export class TripParticipantInputDto {
  @IsUUID('4') public userId!: string;
  @IsIn(['ORGANIZER', 'PARTICIPANT'])
  public role: 'ORGANIZER' | 'PARTICIPANT' = 'PARTICIPANT';
}

export class TripPackItemInputDto {
  @IsOptional() @IsUUID('4') public id?: string;
  @IsOptional() @IsUUID('4') public gearItemId?: string | null;
  @IsString() @Length(1, 200) public name!: string;
  @IsOptional() @IsString() @Length(0, 100) public categoryName?: string;
  @Matches(DECIMAL_QUANTITY_PATTERN) public quantity = '1';
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  public unitWeightGrams = 0;
  @IsIn(GEAR_LOAD_TYPES)
  public loadType: (typeof GEAR_LOAD_TYPES)[number] = 'CARRIED';
  @IsIn(GEAR_CRITICALITIES)
  public criticality: (typeof GEAR_CRITICALITIES)[number] = 'RECOMMENDED';
  @IsOptional() @IsBoolean() public isShared = false;
  @IsOptional() @IsUUID('4') public assignedUserId?: string | null;
  @IsOptional()
  @IsIn(GEAR_PACKING_STATUSES)
  public packingStatus: (typeof GEAR_PACKING_STATUSES)[number] = 'PLANNED';
  @IsOptional() @IsString() @Length(0, 120) public packLocationLabel?: string;
  @IsOptional() @IsString() @Length(0, 2000) public notes?: string;
}

export class TripInputDto {
  @IsString() @Length(1, 200) public title!: string;
  @IsOptional() @IsString() @Length(0, 3000) public description?: string;
  @IsIn(EXPEDITION_TRIP_TYPES)
  public tripType: (typeof EXPEDITION_TRIP_TYPES)[number] = 'DAY_HIKE';
  @Matches(DATE_ONLY_PATTERN) public startsOn!: string;
  @Matches(DATE_ONLY_PATTERN) public endsOn!: string;
  @IsOptional() @IsString() @Length(0, 300) public locationLabel?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(365) public overnightCount = 0;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  public targetBaseWeightGrams?: number | null;
  @IsOptional() @IsString() @Length(0, 5000) public notes?: string;
  @IsOptional() @IsUUID('4') public templateId?: string | null;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TripParticipantInputDto)
  public participants!: TripParticipantInputDto[];
}

export class CreateTripDto extends TripInputDto {}
export class UpdateTripDto extends TripInputDto {}

export class ReplaceTripParticipantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TripParticipantInputDto)
  public participants!: TripParticipantInputDto[];
}

export class ReplaceTripPackItemsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TripPackItemInputDto)
  public items!: TripPackItemInputDto[];
}

export class UpdatePackingStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public itemIds!: string[];
  @IsIn(GEAR_PACKING_STATUSES)
  public status!: (typeof GEAR_PACKING_STATUSES)[number];
}

export class TripReviewItemDto {
  @IsUUID('4') public itemId!: string;
  @IsIn(GEAR_REVIEW_OUTCOMES)
  public outcome!: (typeof GEAR_REVIEW_OUTCOMES)[number];
  @IsOptional() @IsString() @Length(0, 2000) public notes?: string;
}

export class CompleteTripDto {
  @IsBoolean() public confirmed!: boolean;
}

export class ReviewTripDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TripReviewItemDto)
  public items!: TripReviewItemDto[];
}

export class CreateTripTaskDto {
  @IsOptional() @IsUUID('4') public itemId?: string;
  @IsString() @Length(1, 200) public title!: string;
}

export class AcknowledgeReadinessRuleDto {
  @IsString() @Length(1, 80) public ruleCode!: string;
}

export class ApplyTripTemplateDto {
  @IsUUID('4') public templateId!: string;
  @IsBoolean() public confirmed!: boolean;
}

export class ApplyTripReviewToTemplateDto {
  @IsBoolean() public confirmed!: boolean;
  @IsArray()
  @ArrayMaxSize(300)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public removeTripItemIds: string[] = [];
  @IsArray()
  @ArrayMaxSize(300)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  public addTripItemIds: string[] = [];
}
