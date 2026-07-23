import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { taskConflict } from '../../domain/task.errors.js';
import {
  TASK_CATEGORY_REPOSITORY,
  type TaskCategoryRepository,
} from '../../domain/ports/task-category.repository.js';
import { TASK_CATEGORY_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import type { CreateTaskCategoryDto } from '../../presentation/dto/task-category.dto.js';
import { normalizeCategoryName } from './category-name.js';

@Injectable()
export class CreateTaskCategoryService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_CATEGORY_REPOSITORY)
    private readonly categories: TaskCategoryRepository,
  ) {}

  public async execute(userId: string, input: CreateTaskCategoryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_CATEGORY_MUTATION_MINIMUM_ROLE,
    );
    const normalizedName = normalizeCategoryName(input.name);
    if (
      (await this.categories.list(membership.householdId)).some(
        (item) => item.normalizedName === normalizedName,
      )
    )
      throw taskConflict('Kategorie s tímto názvem už existuje.');
    return this.categories.create({
      householdId: membership.householdId,
      userId,
      name: input.name,
      normalizedName,
      colorToken: input.colorToken,
    });
  }
}
