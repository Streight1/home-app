import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  taskCategoryNotFound,
  taskConflict,
  invalidTaskInput,
} from '../../domain/task.errors.js';
import {
  TASK_CATEGORY_REPOSITORY,
  type TaskCategoryRepository,
} from '../../domain/ports/task-category.repository.js';
import { TASK_CATEGORY_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import type { UpdateTaskCategoryDto } from '../../presentation/dto/task-category.dto.js';
import { normalizeCategoryName } from './category-name.js';

@Injectable()
export class UpdateTaskCategoryService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_CATEGORY_REPOSITORY)
    private readonly categories: TaskCategoryRepository,
  ) {}

  public async execute(
    userId: string,
    categoryId: string,
    input: UpdateTaskCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_CATEGORY_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.categories.findById(
      membership.householdId,
      categoryId,
    );
    if (!existing) throw taskCategoryNotFound();
    const changedFields = Object.keys(input);
    if (changedFields.length === 0)
      throw invalidTaskInput('Vyplňte alespoň jednu změnu.');
    const normalizedName = input.name
      ? normalizeCategoryName(input.name)
      : undefined;
    if (
      normalizedName &&
      (await this.categories.list(membership.householdId)).some(
        (item) =>
          item.id !== categoryId && item.normalizedName === normalizedName,
      )
    )
      throw taskConflict('Kategorie s tímto názvem už existuje.');
    const updated = await this.categories.update({
      householdId: membership.householdId,
      userId,
      categoryId,
      ...(input.name && normalizedName
        ? { name: input.name, normalizedName }
        : {}),
      ...(input.colorToken ? { colorToken: input.colorToken } : {}),
      changedFields,
    });
    if (!updated) throw taskCategoryNotFound();
    return updated;
  }
}
