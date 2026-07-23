import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSavedPlaceDto {
  @IsString() @MinLength(1) @MaxLength(120) public label!: string;
  @IsString() @MinLength(1) @MaxLength(300) public formattedAddress!: string;
  @IsIn(['PRIVATE', 'HOUSEHOLD']) public visibility!: 'PRIVATE' | 'HOUSEHOLD';
  @IsIn(['MAPY', 'MANUAL']) public provider!: 'MAPY' | 'MANUAL';
  @IsString() @MinLength(1) @MaxLength(80) public placeType!: string;
}
