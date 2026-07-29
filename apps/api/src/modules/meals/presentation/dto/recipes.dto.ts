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
  INGREDIENT_UNITS,
  RECIPE_DIFFICULTIES,
} from '../../domain/meals.types.js';

const booleanQueryValue = (value: unknown): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class RecipeIngredientInputDto {
  @IsOptional() @IsUUID('4') public ingredientId?: string;
  @IsOptional() @IsString() @Length(1, 120) public ingredientName?: string;
  @IsOptional()
  @Matches(DECIMAL_QUANTITY_PATTERN)
  public quantity?: string | null;
  @IsIn(INGREDIENT_UNITS) public unit!: (typeof INGREDIENT_UNITS)[number];
  @IsOptional() @IsString() @Length(1, 50) public customUnitLabel?: string;
  @IsOptional() @IsString() @Length(0, 300) public preparationNote?: string;
  @IsOptional() @IsBoolean() public isOptional = false;
  @IsOptional() @IsString() @Length(0, 100) public groupLabel?: string;
}

export class RecipeStepInputDto {
  @IsOptional() @IsString() @Length(0, 120) public title?: string;
  @IsString() @Length(1, 5000) public instruction!: string;
  @IsOptional() @IsInt() @Min(1) @Max(1440) public durationMinutes?: number;
}

export class RecipeDocumentInputDto {
  @IsUUID('4') public documentId!: string;
  @IsIn(['PHOTO', 'SOURCE', 'PRINTED_RECIPE', 'OTHER'])
  public relationType!: 'PHOTO' | 'SOURCE' | 'PRINTED_RECIPE' | 'OTHER';
  @IsOptional() @IsBoolean() public isCover = false;
}

export class RecipeInputDto {
  @IsString() @Length(1, 200) public title!: string;
  @IsOptional() @IsString() @Length(0, 2000) public description?: string;
  @Matches(DECIMAL_QUANTITY_PATTERN) public servings!: string;
  @IsOptional() @IsInt() @Min(0) @Max(10080) public preparationMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10080) public cookingMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10080) public restingMinutes?: number;
  @IsOptional()
  @IsIn(RECIPE_DIFFICULTIES)
  public difficulty: (typeof RECIPE_DIFFICULTIES)[number] = 'UNSPECIFIED';
  @IsOptional() @IsUUID('4') public categoryId?: string | null;
  @IsOptional() @IsString() @Length(0, 200) public sourceLabel?: string;
  @IsOptional() @IsUrl() @Length(0, 2000) public sourceUrl?: string;
  @IsOptional() @IsString() @Length(0, 10000) public notes?: string;
  @IsOptional() @IsBoolean() public isFavorite = false;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsUUID('4', { each: true })
  public tagIds: string[] = [];
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInputDto)
  public ingredients: RecipeIngredientInputDto[] = [];
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RecipeStepInputDto)
  public steps: RecipeStepInputDto[] = [];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RecipeDocumentInputDto)
  public documents: RecipeDocumentInputDto[] = [];
}

export class CreateRecipeDto extends RecipeInputDto {}
export class UpdateRecipeDto extends RecipeInputDto {}

export class ListRecipesQueryDto {
  @IsOptional() @IsString() @Length(1, 120) public query?: string;
  @IsOptional() @IsUUID('4') public categoryId?: string;
  @IsOptional() @IsUUID('4') public tagId?: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => booleanQueryValue(value))
  public favoriteOnly = false;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => booleanQueryValue(value))
  public archived = false;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10080)
  public maxPreparationMinutes?: number;
  @IsOptional()
  @IsIn(['title', 'updatedAt', 'createdAt', 'preparationMinutes'])
  public sortBy: 'title' | 'updatedAt' | 'createdAt' | 'preparationMinutes' =
    'updatedAt';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) public page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100])
  public pageSize = 20;
}

export class ScaleRecipeQueryDto {
  @Matches(DECIMAL_QUANTITY_PATTERN) public servings!: string;
}
