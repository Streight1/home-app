import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  MAINTENANCE_ADMIN_ROLE,
  MAINTENANCE_READ_ROLE,
} from '../domain/maintenance.types.js';
import {
  maintenanceConflict,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';
import {
  MAINTENANCE_CLOCK,
  type MaintenanceClock,
} from '../domain/maintenance-clock.port.js';
import { PrismaMaintenanceCategoryRepository } from '../infrastructure/prisma-maintenance-category.repository.js';
import type {
  CreateMaintenanceCategoryDto,
  UpdateMaintenanceCategoryDto,
} from '../presentation/dto/maintenance.dto.js';

@Injectable()
export class MaintenanceCategoriesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly categories: PrismaMaintenanceCategoryRepository,
    @Inject(MAINTENANCE_CLOCK) private readonly clock: MaintenanceClock,
  ) {}

  public async list(userId: string, includeArchived = false) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    return {
      items: await this.categories.list(
        membership.householdId,
        includeArchived,
      ),
    };
  }

  public async create(userId: string, input: CreateMaintenanceCategoryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_ADMIN_ROLE,
    );
    try {
      return await this.categories.create(
        membership.householdId,
        userId,
        input,
      );
    } catch (error) {
      if (isUnique(error))
        throw maintenanceConflict('Kategorie s tímto názvem již existuje.');
      throw error;
    }
  }

  public async update(
    userId: string,
    categoryId: string,
    input: UpdateMaintenanceCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_ADMIN_ROLE,
    );
    try {
      const category = await this.categories.update(
        membership.householdId,
        userId,
        categoryId,
        input,
      );
      if (!category) throw maintenanceNotFound();
      return category;
    } catch (error) {
      if (isUnique(error))
        throw maintenanceConflict('Kategorie s tímto názvem již existuje.');
      throw error;
    }
  }

  public async archive(userId: string, categoryId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_ADMIN_ROLE,
    );
    if (
      !(await this.categories.archive(
        membership.householdId,
        userId,
        categoryId,
        this.clock.now(),
      ))
    )
      throw maintenanceNotFound();
    return { id: categoryId };
  }

  public async createRecommended(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_ADMIN_ROLE,
    );
    return {
      createdCount: await this.categories.createRecommended(
        membership.householdId,
        userId,
      ),
    };
  }
}

const isUnique = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';
