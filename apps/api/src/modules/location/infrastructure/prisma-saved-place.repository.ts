import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { SavedPlaceRecord } from '../domain/location.types.js';
import type { SavedPlaceRepository } from '../domain/ports/saved-place.repository.js';

const mapPlace = (place: {
  id: string;
  householdId: string;
  ownerUserId: string | null;
  visibility: 'PRIVATE' | 'HOUSEHOLD';
  label: string;
  formattedAddress: string;
  provider: 'MAPY' | 'MANUAL';
  placeType: string;
}): SavedPlaceRecord => place;

const placeSelect = {
  id: true,
  householdId: true,
  ownerUserId: true,
  visibility: true,
  label: true,
  formattedAddress: true,
  provider: true,
  placeType: true,
} as const;

@Injectable()
export class PrismaSavedPlaceRepository implements SavedPlaceRepository {
  public constructor(private readonly prisma: PrismaService) {}
  public async listVisible(householdId: string, userId: string) {
    return (
      await this.prisma.savedPlace.findMany({
        where: {
          householdId,
          OR: [{ visibility: 'HOUSEHOLD' }, { ownerUserId: userId }],
        },
        select: placeSelect,
        orderBy: [{ label: 'asc' }, { id: 'asc' }],
      })
    ).map(mapPlace);
  }
  public async findVisible(
    householdId: string,
    userId: string,
    placeId: string,
  ) {
    const place = await this.prisma.savedPlace.findFirst({
      where: {
        id: placeId,
        householdId,
        OR: [{ visibility: 'HOUSEHOLD' }, { ownerUserId: userId }],
      },
      select: placeSelect,
    });
    return place ? mapPlace(place) : null;
  }
  public async findInHousehold(householdId: string, placeId: string) {
    const place = await this.prisma.savedPlace.findFirst({
      where: { id: placeId, householdId },
      select: placeSelect,
    });
    return place ? mapPlace(place) : null;
  }
  public async findForOwner(
    householdId: string,
    ownerUserId: string,
    placeId: string,
  ) {
    const place = await this.prisma.savedPlace.findFirst({
      where: {
        id: placeId,
        householdId,
        OR: [{ visibility: 'HOUSEHOLD' }, { ownerUserId }],
      },
      select: placeSelect,
    });
    return place ? mapPlace(place) : null;
  }
  public async create(input: Parameters<SavedPlaceRepository['create']>[0]) {
    return mapPlace(
      await this.prisma.$transaction(async (transaction) => {
        const place = await transaction.savedPlace.create({
          data: {
            householdId: input.householdId,
            ownerUserId: input.visibility === 'PRIVATE' ? input.userId : null,
            createdByUserId: input.userId,
            visibility: input.visibility,
            label: input.label,
            formattedAddress: input.formattedAddress,
            provider: input.provider,
            placeType: input.placeType,
          },
        });
        await transaction.auditLog.create({
          data: {
            action: 'SAVED_PLACE_CREATED',
            householdId: input.householdId,
            userId: input.userId,
            entityType: 'SavedPlace',
            entityId: place.id,
            metadata: { savedPlaceId: place.id, visibility: place.visibility },
          },
        });
        return transaction.savedPlace.findUniqueOrThrow({
          where: { id: place.id },
          select: placeSelect,
        });
      }),
    );
  }
}
