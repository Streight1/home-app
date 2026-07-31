import { Injectable } from '@nestjs/common';
import type {
  GearImageSearchPort,
  GearImageSearchResult,
} from './gear-image-search.port.js';

@Injectable()
export class DisabledGearImageSearchAdapter implements GearImageSearchPort {
  public readonly configured = false;

  public search(): Promise<readonly GearImageSearchResult[]> {
    return Promise.resolve([]);
  }
}
