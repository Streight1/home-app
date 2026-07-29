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
  Min,
} from 'class-validator';
import {
  DATE_ONLY_PATTERN,
  DECIMAL_QUANTITY_PATTERN,
  INGREDIENT_UNITS,
} from '../../domain/meals.types.js';

export class CreateShoppingListDto {
  @IsString() @Length(1, 160) public title!: string;
  @IsOptional() @IsBoolean() public isDefault = false;
}

export class UpdateShoppingListDto extends CreateShoppingListDto {}

export class ShoppingItemInputDto {
  @IsOptional() @IsUUID('4') public ingredientId?: string | null;
  @IsString() @Length(1, 200) public text!: string;
  @IsOptional()
  @Matches(DECIMAL_QUANTITY_PATTERN)
  public quantity?: string | null;
  @IsOptional()
  @IsIn(INGREDIENT_UNITS)
  public unit?: (typeof INGREDIENT_UNITS)[number] | null;
  @IsOptional() @IsString() @Length(1, 50) public customUnitLabel?: string;
  @IsOptional() @IsUUID('4') public shoppingCategoryId?: string | null;
  @IsOptional() @IsString() @Length(0, 1000) public note?: string;
  @IsOptional() @IsInt() @Min(0) public sortOrder = 0;
}

export class GenerateShoppingPreviewDto {
  @Matches(DATE_ONLY_PATTERN) public dateFrom!: string;
  @Matches(DATE_ONLY_PATTERN) public dateTo!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  public mealPlanEntryIds?: string[];
  @IsOptional() @IsBoolean() public subtractPantry = false;
  @IsOptional() @IsBoolean() public includeOptional = false;
}

export class GenerateShoppingConfirmDto extends GenerateShoppingPreviewDto {
  @IsBoolean() public confirmed!: boolean;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  public excludedKeys: string[] = [];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  public pantryConfirmedKeys: string[] = [];
}

export class CreateCatalogCategoryDto {
  @IsString() @Length(1, 100) public name!: string;
  @IsOptional() @IsString() @Length(1, 50) public iconKey = 'shopping-basket';
  @IsOptional() @IsString() @Length(1, 20) public colorToken = 'cyan';
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) public sortOrder = 0;
}
