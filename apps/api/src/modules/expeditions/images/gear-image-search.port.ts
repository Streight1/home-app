export const GEAR_IMAGE_SEARCH_PORT = Symbol('GEAR_IMAGE_SEARCH_PORT');

export interface GearImageSearchResult {
  id: string;
  previewUrl: string;
  imageUrl: string;
  sourcePageUrl: string;
  attribution: string | null;
}

export interface GearImageSearchPort {
  readonly configured: boolean;
  search(query: string): Promise<readonly GearImageSearchResult[]>;
}
