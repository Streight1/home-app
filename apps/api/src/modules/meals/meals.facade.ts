import { Injectable } from '@nestjs/common';
import { MealPlanningService } from './application/meal-planning.service.js';

@Injectable()
export class MealsFacade {
  public constructor(private readonly planning: MealPlanningService) {}

  public async getCalendarSummary(
    userId: string,
    dateFrom: string,
    dateTo: string,
  ) {
    const result = await this.planning.list(userId, { dateFrom, dateTo });
    return {
      items: result.items.map((entry) => ({
        id: entry.id,
        plannedFor: entry.plannedFor,
        mealType: entry.mealType,
        title: entry.title,
        servings: entry.servings,
        participants: entry.participants.map(({ id, displayName }) => ({
          id,
          displayName,
        })),
      })),
    };
  }
}
