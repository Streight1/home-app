import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../households/household-access.service.js';
import { EXPEDITIONS_READ_ROLE } from './domain/expeditions.types.js';

@Injectable()
export class ExpeditionsSearchProvider {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async search(userId: string, query: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const value = query.trim().slice(0, 160);
    const [gear, templates, trips] = await Promise.all([
      this.prisma.gearItem.findMany({
        where: {
          householdId: membership.householdId,
          archivedAt: null,
          OR: [
            { name: { contains: value, mode: 'insensitive' } },
            { brand: { contains: value, mode: 'insensitive' } },
            { model: { contains: value, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true },
        take: 10,
      }),
      this.prisma.packTemplate.findMany({
        where: {
          householdId: membership.householdId,
          archivedAt: null,
          name: { contains: value, mode: 'insensitive' },
        },
        select: { id: true, name: true },
        take: 10,
      }),
      this.prisma.trip.findMany({
        where: {
          householdId: membership.householdId,
          archivedAt: null,
          OR: [
            { title: { contains: value, mode: 'insensitive' } },
            { locationLabel: { contains: value, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true },
        take: 10,
      }),
    ]);
    return [
      ...gear.map((item) => ({
        id: item.id,
        kind: 'GEAR' as const,
        label: item.name,
        navigationTarget: {
          area: 'expeditions' as const,
          screen: 'gear' as const,
        },
      })),
      ...templates.map((item) => ({
        id: item.id,
        kind: 'PACK_TEMPLATE' as const,
        label: item.name,
        navigationTarget: {
          area: 'expeditions' as const,
          screen: 'templates' as const,
        },
      })),
      ...trips.map((item) => ({
        id: item.id,
        kind: 'TRIP' as const,
        label: item.title,
        navigationTarget: {
          area: 'expeditions' as const,
          screen: 'trip' as const,
          tripId: item.id,
        },
      })),
    ];
  }
}
