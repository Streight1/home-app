import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  DATE_ONLY_PATTERN,
  DECIMAL_QUANTITY_PATTERN,
  INGREDIENT_UNITS,
  PANTRY_STATUSES,
} from '../../domain/meals.types.js';

export class PantryItemInputDto {
  @IsUUID('4') public ingredientId!: string;
  @IsOptional()
  @Matches(DECIMAL_QUANTITY_PATTERN)
  public quantity?: string | null;
  @IsOptional()
  @IsIn(INGREDIENT_UNITS)
  public unit?: (typeof INGREDIENT_UNITS)[number] | null;
  @IsIn(PANTRY_STATUSES)
  public status!: (typeof PANTRY_STATUSES)[number];
  @IsOptional() @Matches(DATE_ONLY_PATTERN) public expiresOn?: string | null;
  @IsOptional() @IsString() @Length(0, 120) public locationLabel?: string;
  @IsOptional() @IsString() @Length(0, 1000) public note?: string;
}
