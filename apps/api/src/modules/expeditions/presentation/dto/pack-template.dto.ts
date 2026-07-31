import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  DECIMAL_QUANTITY_PATTERN,
  EXPEDITION_TRIP_TYPES,
  GEAR_CRITICALITIES,
  GEAR_LOAD_TYPES,
} from '../../domain/expeditions.types.js';

export class PackTemplateItemInputDto {
  @IsOptional() @IsUUID('4') public gearItemId?: string | null;
  @IsOptional() @IsString() @Length(1, 200) public customName?: string;
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
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
  @IsOptional() @IsUUID('4') public defaultAssignedUserId?: string | null;
  @IsOptional() @IsString() @Length(0, 120) public packLocationLabel?: string;
  @IsOptional() @IsString() @Length(0, 2000) public notes?: string;
}

export class PackTemplateInputDto {
  @IsString() @Length(1, 200) public name!: string;
  @IsOptional() @IsString() @Length(0, 3000) public description?: string;
  @IsIn(EXPEDITION_TRIP_TYPES)
  public tripType: (typeof EXPEDITION_TRIP_TYPES)[number] = 'DAY_HIKE';
  @IsOptional() @IsString() @Length(0, 80) public seasonLabel?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  public targetBaseWeightGrams?: number | null;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  public defaultParticipantCount = 1;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => PackTemplateItemInputDto)
  public items: PackTemplateItemInputDto[] = [];
}

export class CreatePackTemplateDto extends PackTemplateInputDto {}
export class UpdatePackTemplateDto extends PackTemplateInputDto {}

export class ReplacePackTemplateItemsDto {
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => PackTemplateItemInputDto)
  public items!: PackTemplateItemInputDto[];
}

export class UpdateTemplateSnapshotsDto {
  @IsBoolean() public confirmed!: boolean;
}
