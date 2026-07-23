import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../../config/app-config.service.js';

export class MapyProviderError extends Error {
  public constructor(
    public readonly code:
      | 'DISABLED'
      | 'TIMEOUT'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'UPSTREAM',
  ) {
    super(`Mapy provider error: ${code}`);
  }
}

@Injectable()
export class MapyApiClient {
  public constructor(private readonly config: AppConfigService) {}
  public async get(
    path: string,
    parameters: URLSearchParams,
  ): Promise<unknown> {
    if (!this.config.mapyApiEnabled) throw new MapyProviderError('DISABLED');
    const response = await fetch(
      `https://api.mapy.com${path}?${parameters.toString()}`,
      {
        headers: {
          'X-Mapy-Api-Key': this.config.mapyApiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.config.mapyApiTimeoutMs),
      },
    ).catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      )
        throw new MapyProviderError('TIMEOUT');
      throw new MapyProviderError('UPSTREAM');
    });
    if (!response.ok) {
      if (response.status === 401) throw new MapyProviderError('UNAUTHORIZED');
      if (response.status === 403) throw new MapyProviderError('FORBIDDEN');
      if (response.status === 404) throw new MapyProviderError('NOT_FOUND');
      throw new MapyProviderError('UPSTREAM');
    }
    return response.json() as Promise<unknown>;
  }
}
