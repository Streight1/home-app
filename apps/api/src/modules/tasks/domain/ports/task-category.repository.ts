export const TASK_CATEGORY_REPOSITORY = Symbol('TASK_CATEGORY_REPOSITORY');

export const taskCategoryColorTokens = [
  'primary',
  'blue',
  'cyan',
  'success',
  'warning',
  'danger',
] as const;

export type TaskCategoryColorToken = (typeof taskCategoryColorTokens)[number];

export interface TaskCategoryRecord {
  id: string;
  householdId: string;
  name: string;
  normalizedName: string;
  colorToken: TaskCategoryColorToken;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCategoryRepository {
  list(householdId: string): Promise<TaskCategoryRecord[]>;
  findById(
    householdId: string,
    categoryId: string,
  ): Promise<TaskCategoryRecord | null>;
  create(input: {
    householdId: string;
    userId: string;
    name: string;
    normalizedName: string;
    colorToken: TaskCategoryColorToken;
  }): Promise<TaskCategoryRecord>;
  update(input: {
    householdId: string;
    userId: string;
    categoryId: string;
    name?: string;
    normalizedName?: string;
    colorToken?: TaskCategoryColorToken;
    changedFields: readonly string[];
  }): Promise<TaskCategoryRecord | null>;
  delete(input: {
    householdId: string;
    userId: string;
    categoryId: string;
  }): Promise<boolean>;
}
