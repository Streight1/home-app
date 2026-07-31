import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { IsDateOnly } from '../../../../common/time/is-date-only.decorator.js';
import {
  DECIMAL_QUANTITY_PATTERN,
  MEAL_TYPES,
} from '../../domain/meals.types.js';

export class MealPlanInputDto {
  @IsDateOnly() public plannedFor!: string;
  @IsIn(MEAL_TYPES) public mealType!: (typeof MEAL_TYPES)[number];
  @IsOptional() @IsString() @Length(1, 80) public customMealTypeLabel?: string;
  @IsOptional() @IsUUID('4') public recipeId?: string | null;
  @IsString() @Length(1, 200) public title!: string;
  @Matches(DECIMAL_QUANTITY_PATTERN) public servings!: string;
  @IsOptional() @IsString() @Length(0, 2000) public notes?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  public participantUserIds: string[] = [];
}

export class CreateMealPlanEntryDto extends MealPlanInputDto {}
export class UpdateMealPlanEntryDto extends MealPlanInputDto {}

export class MealPlanRangeQueryDto {
  @IsDateOnly() public dateFrom!: string;
  @IsDateOnly() public dateTo!: string;
}

export class CopyMealPlanWeekDto {
  @IsDateOnly() public sourceWeekStart!: string;
  @IsDateOnly() public targetWeekStart!: string;
  @IsOptional() @IsBoolean() public replaceExisting = false;
  @IsOptional() @IsBoolean() public confirmed = false;
}

export class MealsCalendarSummaryQueryDto extends MealPlanRangeQueryDto {
  @IsOptional() @Type(() => Boolean) @IsBoolean() public compact = true;
}
