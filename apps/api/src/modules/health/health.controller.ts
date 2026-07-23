import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { InternalEndpoint } from '../../common/access/internal-endpoint.decorator.js';
import { ApiException } from '../../common/errors/api-exception.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

@InternalEndpoint()
@Controller('internal/health')
export class HealthController {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get('live')
  public live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  public async ready(): Promise<{ status: 'ready'; database: 'up' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up' };
    } catch {
      throw new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'DATABASE_UNAVAILABLE',
        'Databáze momentálně není dostupná.',
      );
    }
  }
}
