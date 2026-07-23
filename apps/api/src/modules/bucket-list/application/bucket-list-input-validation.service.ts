import { Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { LocationFacade } from '../../location/location.facade.js';
import { invalidBucketList } from '../domain/bucket-list.errors.js';

@Injectable()
export class BucketListInputValidationService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly documents: DocumentsFacade,
    private readonly locations: LocationFacade,
  ) {}

  public async validate(
    userId: string,
    householdId: string,
    input: {
      participantUserIds?: readonly string[];
      documentIds?: readonly string[];
      locationPlaceId?: string | null;
      locationLabel?: string | null;
    },
  ) {
    const participantUserIds =
      input.participantUserIds === undefined
        ? undefined
        : [...new Set(input.participantUserIds)];
    const documentIds =
      input.documentIds === undefined
        ? undefined
        : [...new Set(input.documentIds)];
    await this.access.assertActiveMembers(
      householdId,
      participantUserIds ?? [],
    );
    if (documentIds?.length)
      await this.documents.verifyAccessibleSummaries(userId, documentIds);
    if (!input.locationPlaceId) {
      return {
        ...(participantUserIds ? { participantUserIds } : {}),
        ...(documentIds ? { documentIds } : {}),
        ...(input.locationLabel !== undefined
          ? { locationLabel: trimmedOrNull(input.locationLabel) }
          : {}),
      };
    }
    const place = await this.locations.findAccessiblePlace(
      householdId,
      userId,
      input.locationPlaceId,
    );
    if (!place)
      throw invalidBucketList('Vybrané místo není v této domácnosti dostupné.');
    return {
      ...(participantUserIds ? { participantUserIds } : {}),
      ...(documentIds ? { documentIds } : {}),
      locationLabel: place.label,
    };
  }
}

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}
