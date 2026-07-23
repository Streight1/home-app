import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  TASK_CATEGORY_REPOSITORY,
  type TaskCategoryRepository,
} from '../../domain/ports/task-category.repository.js';
import { TASK_READ_MINIMUM_ROLE } from '../../domain/task-access.policy.js';

@Injectable()
export class ListTaskCategoriesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_CATEGORY_REPOSITORY)
    private readonly categories: TaskCategoryRepository,
  ) {}

  public async execute(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_READ_MINIMUM_ROLE,
    );
    return this.categories.list(membership.householdId);
  }
}
