import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { routeUnavailable } from '../../domain/location.errors.js';
import {
  ROUTING_PROVIDER_PORT,
  type RoutingProviderPort,
} from '../../domain/ports/routing-provider.port.js';

@Injectable()
export class CalculateRouteEstimateService {
  public constructor(
    private readonly config: AppConfigService,
    @Inject(ROUTING_PROVIDER_PORT)
    private readonly provider: RoutingProviderPort,
  ) {}
  public async execute(input: Parameters<RoutingProviderPort['calculate']>[0]) {
    if (!this.config.mapyApiEnabled) throw routeUnavailable();
    try {
      return await this.provider.calculate(input);
    } catch {
      throw routeUnavailable();
    }
  }
}
