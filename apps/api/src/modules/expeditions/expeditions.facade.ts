import { Injectable } from '@nestjs/common';
import { ExpeditionsSearchProvider } from './expeditions-search.provider.js';

@Injectable()
export class ExpeditionsFacade {
  public constructor(
    private readonly searchProvider: ExpeditionsSearchProvider,
  ) {}

  public search(userId: string, query: string) {
    return this.searchProvider.search(userId, query);
  }
}
