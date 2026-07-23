import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  locationInvalidInput,
  locationProviderForbidden,
  locationProviderNotConfigured,
  locationProviderUnavailable,
} from '../../domain/location.errors.js';
import {
  GEOCODING_PROVIDER_PORT,
  type GeocodingProviderPort,
} from '../../domain/ports/geocoding-provider.port.js';

@Injectable()
export class SuggestPlacesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly config: AppConfigService,
    @Inject(GEOCODING_PROVIDER_PORT)
    private readonly provider: GeocodingProviderPort,
  ) {}

  public async execute(
    userId: string,
    query: string,
    types: readonly string[],
  ) {
    await this.access.getActiveMembership(userId);
    const normalized = query.trim().replace(/\s+/g, ' ');
    if (normalized.length < this.config.mapySuggestMinQueryLength)
      throw locationInvalidInput(
        `Zadejte alespoň ${String(this.config.mapySuggestMinQueryLength)} znaky.`,
      );
    if (!this.config.mapyApiEnabled) throw locationProviderNotConfigured();
    const safeTypes = types.filter((type) =>
      ['regional', 'regional.address', 'regional.municipality', 'poi'].includes(
        type,
      ),
    );
    const resolvedTypes = safeTypes.length ? safeTypes : ['regional', 'poi'];
    let value: Awaited<ReturnType<GeocodingProviderPort['suggest']>>;
    try {
      value = await this.provider.suggest({
        query: normalized,
        language: this.config.mapyDefaultLanguage,
        limit: this.config.mapySuggestMaxResults,
        types: resolvedTypes,
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN')
      )
        throw locationProviderForbidden();
      throw locationProviderUnavailable();
    }
    return { items: value };
  }
}
