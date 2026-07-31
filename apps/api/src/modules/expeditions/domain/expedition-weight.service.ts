import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { expeditionsInvalid } from './expeditions.errors.js';
import { DECIMAL_QUANTITY_PATTERN } from './expeditions.types.js';

export interface WeightCalculationItem {
  id: string;
  name: string;
  categoryNameSnapshot: string | null;
  assignedUserId: string | null;
  quantity: string;
  unitWeightGrams: number;
  loadType: 'CARRIED' | 'WORN' | 'CONSUMABLE';
  packingStatus: 'PLANNED' | 'PACKED' | 'MISSING' | 'EXCLUDED';
}

export interface WeightTotals {
  baseWeightGrams: number;
  wornWeightGrams: number;
  consumableWeightGrams: number;
  startingPackWeightGrams: number;
  systemWeightGrams: number;
}

const emptyTotals = (): WeightTotals => ({
  baseWeightGrams: 0,
  wornWeightGrams: 0,
  consumableWeightGrams: 0,
  startingPackWeightGrams: 0,
  systemWeightGrams: 0,
});

@Injectable()
export class ExpeditionWeightService {
  public itemWeight(item: WeightCalculationItem): number {
    if (
      !DECIMAL_QUANTITY_PATTERN.test(item.quantity) ||
      item.unitWeightGrams < 0
    )
      throw expeditionsInvalid('Hmotnost nebo množství položky není platné.');
    return new Prisma.Decimal(item.quantity)
      .mul(item.unitWeightGrams)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
  }

  public calculate(items: readonly WeightCalculationItem[]) {
    const included = items.filter(
      ({ packingStatus }) => packingStatus !== 'EXCLUDED',
    );
    const totals = this.sum(included);
    const packedWeightGrams = this.sum(
      included.filter(({ packingStatus }) => packingStatus === 'PACKED'),
    ).systemWeightGrams;
    const categories = this.group(
      included,
      (item) => item.categoryNameSnapshot ?? 'Ostatní',
    );
    const participantWeights = this.group(
      included,
      (item) => item.assignedUserId ?? 'unassigned',
    );
    const heaviest = included
      .map((item) => ({
        id: item.id,
        name: item.name,
        weightGrams: this.itemWeight(item),
      }))
      .sort((a, b) => b.weightGrams - a.weightGrams)
      .slice(0, 10);
    return {
      ...totals,
      packedWeightGrams,
      totalPlannedWeightGrams: totals.systemWeightGrams,
      categories,
      participantWeights,
      heaviest,
    };
  }

  private group(
    items: readonly WeightCalculationItem[],
    key: (item: WeightCalculationItem) => string,
  ) {
    const groups = new Map<string, WeightCalculationItem[]>();
    for (const item of items)
      groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
    return [...groups.entries()].map(([name, values]) => ({
      key: name,
      ...this.sum(values),
    }));
  }

  private sum(items: readonly WeightCalculationItem[]): WeightTotals {
    const totals = emptyTotals();
    for (const item of items) {
      const weight = this.itemWeight(item);
      if (item.loadType === 'CARRIED') totals.baseWeightGrams += weight;
      if (item.loadType === 'WORN') totals.wornWeightGrams += weight;
      if (item.loadType === 'CONSUMABLE')
        totals.consumableWeightGrams += weight;
    }
    totals.startingPackWeightGrams =
      totals.baseWeightGrams + totals.consumableWeightGrams;
    totals.systemWeightGrams =
      totals.startingPackWeightGrams + totals.wornWeightGrams;
    return totals;
  }
}
