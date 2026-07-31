import { Injectable } from '@nestjs/common';

interface ReadinessItem {
  id: string;
  name: string;
  criticality: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  packingStatus: 'PLANNED' | 'PACKED' | 'MISSING' | 'EXCLUDED';
  isShared: boolean;
  assignedUserId: string | null;
  categoryName: string | null;
}

interface ReadinessTrip {
  tripType:
    | 'DAY_HIKE'
    | 'OVERNIGHT'
    | 'MULTI_DAY_TREK'
    | 'HUT_TO_HUT'
    | 'CAMPING'
    | 'OTHER';
}

@Injectable()
export class TripReadinessService {
  public evaluate(
    trip: ReadinessTrip,
    items: readonly ReadinessItem[],
    acknowledgedCodes: readonly string[] = [],
  ) {
    const required = items.filter(
      ({ criticality, packingStatus }) =>
        criticality === 'REQUIRED' && packingStatus !== 'EXCLUDED',
    );
    const unpackedRequired = required.filter(
      ({ packingStatus }) => packingStatus !== 'PACKED',
    );
    const missingRequired = required.filter(
      ({ packingStatus }) => packingStatus === 'MISSING',
    );
    const unassignedSharedRequired = required.filter(
      ({ isShared, assignedUserId }) => isShared && !assignedUserId,
    );
    const categorySet = new Set(
      items
        .filter(({ packingStatus }) => packingStatus !== 'EXCLUDED')
        .map(({ categoryName }) => categoryName?.toLocaleLowerCase('cs-CZ')),
    );
    const rules = [
      trip.tripType !== 'DAY_HIKE' && !this.hasAny(categorySet, ['spaní'])
        ? this.rule(
            'NO_SLEEP_SYSTEM',
            'Výprava s přenocováním nemá položku v kategorii Spaní.',
          )
        : null,
      trip.tripType !== 'DAY_HIKE' &&
      trip.tripType !== 'HUT_TO_HUT' &&
      !this.hasAny(categorySet, ['přístřešek'])
        ? this.rule(
            'NO_SHELTER',
            'Výprava s přenocováním nemá přístřešek ani režim noclehu na chatách.',
          )
        : null,
      !this.hasAny(categorySet, ['voda'])
        ? this.rule('NO_WATER', 'Seznam neobsahuje kategorii Voda.')
        : null,
      !this.hasAny(categorySet, ['lékárnička'])
        ? this.rule('NO_FIRST_AID', 'Seznam neobsahuje kategorii Lékárnička.')
        : null,
      !this.hasAny(categorySet, ['navigace', 'elektronika'])
        ? this.rule(
            'NO_NAVIGATION_OR_LIGHT',
            'Seznam neobsahuje navigaci ani světlo.',
          )
        : null,
    ].filter((rule) => rule !== null);
    return {
      ready:
        unpackedRequired.length === 0 &&
        missingRequired.length === 0 &&
        unassignedSharedRequired.length === 0,
      packedCount: items.filter(
        ({ packingStatus }) => packingStatus === 'PACKED',
      ).length,
      totalCount: items.filter(
        ({ packingStatus }) => packingStatus !== 'EXCLUDED',
      ).length,
      unpackedRequiredCount: unpackedRequired.length,
      missingRequiredCount: missingRequired.length,
      unassignedSharedRequiredCount: unassignedSharedRequired.length,
      blockingItems: [
        ...new Map(
          [...unpackedRequired, ...unassignedSharedRequired].map((item) => [
            item.id,
            { id: item.id, name: item.name },
          ]),
        ).values(),
      ],
      advisoryRules: rules.map((rule) => ({
        ...rule,
        acknowledged: acknowledgedCodes.includes(rule.code),
      })),
      disclaimer:
        'Kontrola vychází pouze z vašeho seznamu a nenahrazuje posouzení podmínek výpravy.',
    };
  }

  private hasAny(values: Set<string | undefined>, expected: string[]) {
    return expected.some((value) => values.has(value));
  }

  private rule(code: string, reason: string) {
    return { code, reason };
  }
}
