import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DECIMAL_QUANTITY_PATTERN,
  GEAR_CRITICALITIES,
  GEAR_LOAD_TYPES,
  GEAR_WEIGHT_STATUSES,
} from '../../domain/expeditions.types.js';

const booleanValue = (value: unknown) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class GearDocumentInputDto {
  @IsUUID('4') public documentId!: string;
  @IsIn(['PHOTO', 'MANUAL', 'RECEIPT', 'OTHER'])
  public relationType!: 'PHOTO' | 'MANUAL' | 'RECEIPT' | 'OTHER';
  @IsOptional() @IsBoolean() public isCover = false;
}

export class ReplaceGearDocumentsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GearDocumentInputDto)
  public documents!: GearDocumentInputDto[];
}

export class GearItemInputDto {
  @IsString() @Length(1, 200) public name!: string;
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsOptional() @IsString() @Length(0, 120) public brand?: string;
  @IsOptional() @IsString() @Length(0, 120) public model?: string;
  @IsOptional() @IsString() @Length(0, 2000) public description?: string;
  @IsOptional() @IsString() @Length(0, 5000) public notes?: string;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  public weightGrams = 0;
  @IsIn(GEAR_WEIGHT_STATUSES)
  public weightStatus: (typeof GEAR_WEIGHT_STATUSES)[number] = 'UNKNOWN';
  @IsIn(GEAR_LOAD_TYPES)
  public defaultLoadType: (typeof GEAR_LOAD_TYPES)[number] = 'CARRIED';
  @IsIn(GEAR_CRITICALITIES)
  public defaultCriticality: (typeof GEAR_CRITICALITIES)[number] =
    'RECOMMENDED';
  @IsOptional() @IsUUID('4') public ownerUserId?: string | null;
  @IsOptional() @IsBoolean() public isHouseholdShared = true;
  @Matches(DECIMAL_QUANTITY_PATTERN) public defaultQuantity = '1';
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  public purchaseUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  public productUrl?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GearDocumentInputDto)
  public documents: GearDocumentInputDto[] = [];
}

export class CreateGearItemDto extends GearItemInputDto {}
export class UpdateGearItemDto extends GearItemInputDto {}

export class ListGearQueryDto {
  @IsOptional() @IsString() @Length(1, 160) public query?: string;
  @IsOptional() @IsUUID('4') public categoryId?: string;
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => booleanValue(value))
  @IsBoolean()
  public archived = false;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) public page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100])
  public pageSize = 20;
}

export class GearCategoryInputDto {
  @IsString() @Length(1, 100) public name!: string;
  @IsString() @Length(1, 50) public iconKey = 'backpack';
  @IsIn([
    'violet',
    'blue',
    'cyan',
    'green',
    'amber',
    'orange',
    'rose',
    'pink',
    'neutral',
  ])
  public colorToken = 'green';
  @Type(() => Number) @IsInt() @Min(0) @Max(10_000) public sortOrder = 0;
}

export class GearImageFromUrlDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @Length(1, 2000)
  public imageUrl!: string;
  @IsOptional() @IsString() @Length(0, 500) public attribution?: string;
  @IsOptional() @IsBoolean() public setAsCover = true;
}

export class GearImageSearchDto {
  @IsString() @Length(2, 160) public query!: string;
}
