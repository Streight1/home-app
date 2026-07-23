import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { taskCategoryNotFound } from '../../domain/task.errors.js';
import {
  TASK_CATEGORY_REPOSITORY,
  type TaskCategoryRepository,
} from '../../domain/ports/task-category.repository.js';
import { TASK_CATEGORY_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';

@Injectable()
export class DeleteTaskCategoryService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_CATEGORY_REPOSITORY)
    private readonly categories: TaskCategoryRepository,
  ) {}

  public async execute(userId: string, categoryId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_CATEGORY_MUTATION_MINIMUM_ROLE,
    );
    if (
      !(await this.categories.delete({
        householdId: membership.householdId,
        userId,
        categoryId,
      }))
    )
      throw taskCategoryNotFound();
  }
}
