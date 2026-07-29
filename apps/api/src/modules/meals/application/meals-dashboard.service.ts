import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  currentDateOnly,
  dateOnly,
  dateOnlyString,
  MEALS_READ_ROLE,
} from '../domain/meals.types.js';
import { decimalString } from '../shared/measurement/decimal-quantity.js';

@Injectable()
export class MealsDashboardService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async get(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const today = currentDateOnly();
    const tomorrowDate = dateOnly(today);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrow = dateOnlyString(tomorrowDate);
    const [meals, defaultList] = await this.prisma.$transaction([
      this.prisma.mealPlanEntry.findMany({
        where: {
          householdId: membership.householdId,
          plannedFor: { in: [dateOnly(today), dateOnly(tomorrow)] },
        },
        orderBy: [{ plannedFor: 'asc' }, { mealType: 'asc' }],
        select: {
          id: true,
          plannedFor: true,
          mealType: true,
          title: true,
          servings: true,
        },
      }),
      this.prisma.shoppingList.findFirst({
        where: {
          householdId: membership.householdId,
          status: 'OPEN',
          archivedAt: null,
        },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        select: {
          id: true,
          title: true,
          _count: { select: { items: { where: { checkedAt: null } } } },
        },
      }),
    ]);
    return {
      today,
      todayMeals: meals
        .filter(({ plannedFor }) => dateOnlyString(plannedFor) === today)
        .map(this.summary),
      tomorrowMeal:
        meals
          .filter(({ plannedFor }) => dateOnlyString(plannedFor) === tomorrow)
          .map(this.summary)
          .find(
            ({ mealType }) => mealType === 'LUNCH' || mealType === 'DINNER',
          ) ?? null,
      shoppingList: defaultList
        ? {
            id: defaultList.id,
            title: defaultList.title,
            openItemCount: defaultList._count.items,
          }
        : null,
    };
  }

  private readonly summary = (meal: {
    id: string;
    plannedFor: Date;
    mealType: string;
    title: string;
    servings: { toFixed(value: number): string };
  }) => ({
    id: meal.id,
    plannedFor: dateOnlyString(meal.plannedFor),
    mealType: meal.mealType,
    title: meal.title,
    servings: decimalString(meal.servings as never),
  });
}
