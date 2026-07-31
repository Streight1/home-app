import { Transform, Type } from 'class-transformer';
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
  Max,
  Min,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  BUCKET_LIST_CATEGORIES,
  BUCKET_LIST_ITEM_STATUSES,
  BUCKET_LIST_PRIORITIES,
  BUCKET_LIST_STATUSES,
  type BucketListCategory,
  type BucketListItemStatus,
  type BucketListPriority,
} from '../../domain/bucket-list.types.js';

export class CreateBucketListDto {
  @Type(() => Number) @IsInt() @Min(2000) @Max(2200) public year!: number;
  @IsOptional() @IsString() @Length(1, 160) public title?: string;
  @IsOptional() @IsString() @Length(0, 1000) public description?: string;
  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE'])
  public status: 'DRAFT' | 'ACTIVE' = 'ACTIVE';
}

export class UpdateBucketListDto {
  @IsOptional() @IsString() @Length(1, 160) public title?: string;
  @IsOptional() @IsString() @Length(0, 1000) public description?: string;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE']) public status?: 'DRAFT' | 'ACTIVE';
}

export class ListBucketListsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2200)
  public year?: number;
  @IsOptional()
  @IsIn(BUCKET_LIST_STATUSES)
  public status?: (typeof BUCKET_LIST_STATUSES)[number];
}

export class ListBucketListItemsQueryDto {
  @IsOptional()
  @IsIn(BUCKET_LIST_ITEM_STATUSES)
  public status?: BucketListItemStatus;
  @IsOptional()
  @IsIn(BUCKET_LIST_CATEGORIES)
  public category?: BucketListCategory;
  @IsOptional() @IsUUID('4') public participantUserId?: string;
  @IsOptional() @IsString() @Length(1, 120) public query?: string;
  @IsOptional()
  @IsIn(['sortOrder', 'targetDate', 'title', 'createdAt', 'completedAt'])
  public sortBy:
    | 'sortOrder'
    | 'targetDate'
    | 'title'
    | 'createdAt'
    | 'completedAt' = 'sortOrder';
  @IsOptional() @IsIn(['asc', 'desc']) public sortDirection: 'asc' | 'desc' =
    'asc';
}

export class BucketListItemInputDto {
  @IsString() @Length(1, 200) public title!: string;
  @IsOptional() @IsString() @Length(0, 2000) public description?: string;
  @IsOptional()
  @IsIn(BUCKET_LIST_CATEGORIES)
  public category: BucketListCategory = 'OTHER';
  @IsOptional()
  @IsIn(BUCKET_LIST_PRIORITIES)
  public priority: BucketListPriority = 'NORMAL';
  @IsOptional() @IsDateOnly() public targetDate?: string;
  @IsOptional() @IsUUID('4') public locationPlaceId?: string;
  @IsOptional()
  @IsString()
  @Length(0, 300)
  public locationLabel?: string | null;
  @IsOptional() @IsString() @Length(0, 1000) public locationNotes?: string;
  @IsOptional() @IsString() @Length(0, 10000) public notes?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) public sortOrder?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantUserIds: string[] = [];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public documentIds: string[] = [];
}

export class CreateBucketListItemDto extends BucketListItemInputDto {}

export class UpdateBucketListItemDto {
  @IsOptional() @IsString() @Length(1, 200) public title?: string;
  @IsOptional() @IsString() @Length(0, 2000) public description?: string;
  @IsOptional()
  @IsIn(BUCKET_LIST_CATEGORIES)
  public category?: BucketListCategory;
  @IsOptional()
  @IsIn(BUCKET_LIST_PRIORITIES)
  public priority?: BucketListPriority;
  @IsOptional() @IsDateOnly() public targetDate?: string | null;
  @IsOptional() @IsUUID('4') public locationPlaceId?: string | null;
  @IsOptional()
  @IsString()
  @Length(0, 300)
  public locationLabel?: string | null;
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  public locationNotes?: string | null;
  @IsOptional() @IsString() @Length(0, 10000) public notes?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) public sortOrder?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantUserIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public documentIds?: string[];
}

export class BucketListCompletionDto {
  @IsOptional() @IsDateOnly() public completedDate?: string;
  @IsOptional() @IsString() @Length(0, 5000) public note?: string;
}

export class SkipBucketListItemDto {
  @IsOptional() @IsString() @Length(0, 1000) public reason?: string;
}

export class SetBucketListParticipantsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantUserIds!: string[];
}

export class SetBucketListDocumentsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  public documentIds!: string[];
}

export class PrepareBucketListRolloverDto {
  @Type(() => Number) @IsInt() @Min(2000) @Max(2200) public targetYear!: number;
}

export class CarryBucketListItemsDto extends PrepareBucketListRolloverDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  public itemIds!: string[];
  @IsOptional() @IsBoolean() public carryDocuments = true;
  @IsOptional() @IsBoolean() public carryTargetDate = false;
}

export class BucketListYearQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(2000)
  @Max(2200)
  public year?: number;
}
