import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  SEARCH_ENTITY_TYPES,
  type SearchGroupKey,
  type SearchNavigationTarget,
  type SearchProviderKey,
  type SearchEntityType,
} from '../../../../common/search/application-search-provider.js';

export class SearchRequestDto {
  @IsString()
  @Length(2, 160)
  public query!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SEARCH_ENTITY_TYPES.length)
  @IsIn(SEARCH_ENTITY_TYPES, { each: true })
  public types?: SearchEntityType[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  public limitPerType = 5;
}

export interface SearchResultDto {
  resultId: string;
  providerKey: SearchProviderKey;
  entityKind: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  matchedField: string;
  iconKey: string;
  dateLabel?: string;
  badges?: { label: string; tone?: 'neutral' | 'info' | 'warning' }[];
  score: number;
  navigationTarget: SearchNavigationTarget;
}

export interface SearchResultGroupDto {
  key: SearchGroupKey;
  label: string;
  total: number;
  items: SearchResultDto[];
}

export interface SearchResponseDto {
  groups: SearchResultGroupDto[];
  partial: boolean;
  unavailableProviders: string[];
}
