import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  mealsConflict,
  mealsInvalid,
  mealsNotFound,
} from '../domain/meals.errors.js';
import {
  dateOnly,
  MEALS_READ_ROLE,
  MEALS_WRITE_ROLE,
  optionalText,
} from '../domain/meals.types.js';
import type {
  CopyMealPlanWeekDto,
  MealPlanInputDto,
  MealPlanRangeQueryDto,
} from '../presentation/dto/planning.dto.js';
import { decimalQuantity } from '../shared/measurement/decimal-quantity.js';
import {
  mapMealEntry,
  mealEntryInclude,
  type MealEntryRecord,
} from './meals-response.mapper.js';

@Injectable()
export class MealPlanningService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string, query: MealPlanRangeQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    if (query.dateTo < query.dateFrom)
      throw mealsInvalid('Konec období nesmí být před začátkem.');
    const [items, members] = await this.prisma.$transaction([
      this.prisma.mealPlanEntry.findMany({
        where: {
          householdId: membership.householdId,
          plannedFor: {
            gte: dateOnly(query.dateFrom),
            lte: dateOnly(query.dateTo),
          },
        },
        include: mealEntryInclude,
        orderBy: [
          { plannedFor: 'asc' },
          { mealType: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      this.prisma.householdMember.findMany({
        where: {
          householdId: membership.householdId,
          user: { status: 'ACTIVE' },
        },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    const colors = new Map(
      members.map((member) => [member.userId, member.calendarColorToken]),
    );
    return {
      items: items.map((entry) => ({
        ...mapMealEntry(entry),
        participants: mapMealEntry(entry).participants.map((participant) => ({
          ...participant,
          colorToken: colors.get(participant.id) ?? 'neutral',
        })),
      })),
      members: members.map(({ user, calendarColorToken }) => ({
        id: user.id,
        displayName: user.displayName ?? user.email,
        avatarUrl: user.avatarUrl,
        calendarColorToken,
      })),
    };
  }

  public async create(userId: string, input: MealPlanInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.verify(membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.mealPlanEntry.create({
        data: {
          householdId: membership.householdId,
          ...this.data(input),
          createdByUserId: userId,
          updatedByUserId: userId,
          participants: {
            create: input.participantUserIds.map((participantUserId) => ({
              userId: participantUserId,
              createdByUserId: userId,
            })),
          },
        },
        include: mealEntryInclude,
      });
      await this.audit.record(tx, {
        action: 'MEAL_PLAN_ENTRY_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'MealPlanEntry',
        entityId: entry.id,
      });
      return entry;
    });
    return mapMealEntry(record);
  }

  public async update(
    userId: string,
    entryId: string,
    input: MealPlanInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.find(membership.householdId, entryId);
    await this.verify(membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.mealPlanParticipant.deleteMany({
        where: { mealPlanEntryId: entryId },
      });
      const entry = await tx.mealPlanEntry.update({
        where: { id: entryId },
        data: {
          ...this.data(input),
          updatedByUserId: userId,
          participants: {
            create: input.participantUserIds.map((participantUserId) => ({
              userId: participantUserId,
              createdByUserId: userId,
            })),
          },
        },
        include: mealEntryInclude,
      });
      await this.audit.record(tx, {
        action: 'MEAL_PLAN_ENTRY_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'MealPlanEntry',
        entityId: entryId,
      });
      return entry;
    });
    return mapMealEntry(record);
  }

  public async remove(userId: string, entryId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.find(membership.householdId, entryId);
    await this.prisma.$transaction(async (tx) => {
      await tx.mealPlanEntry.delete({ where: { id: entryId } });
      await this.audit.record(tx, {
        action: 'MEAL_PLAN_ENTRY_DELETED',
        householdId: membership.householdId,
        userId,
        entityType: 'MealPlanEntry',
        entityId: entryId,
      });
    });
    return { id: entryId };
  }

  public async copyWeek(userId: string, input: CopyMealPlanWeekDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    if (input.sourceWeekStart === input.targetWeekStart)
      throw mealsInvalid('Zdrojový a cílový týden musí být odlišný.');
    const sourceStart = dateOnly(input.sourceWeekStart);
    const targetStart = dateOnly(input.targetWeekStart);
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setUTCDate(sourceEnd.getUTCDate() + 6);
    const targetEnd = new Date(targetStart);
    targetEnd.setUTCDate(targetEnd.getUTCDate() + 6);
    const [source, targetCount] = await this.prisma.$transaction([
      this.prisma.mealPlanEntry.findMany({
        where: {
          householdId: membership.householdId,
          plannedFor: { gte: sourceStart, lte: sourceEnd },
        },
        include: { participants: true },
      }),
      this.prisma.mealPlanEntry.count({
        where: {
          householdId: membership.householdId,
          plannedFor: { gte: targetStart, lte: targetEnd },
        },
      }),
    ]);
    if (input.replaceExisting && targetCount > 0 && !input.confirmed)
      throw mealsConflict('Přepsání cílového týdne vyžaduje potvrzení.');
    const result = await this.prisma.$transaction(async (tx) => {
      if (input.replaceExisting)
        await tx.mealPlanEntry.deleteMany({
          where: {
            householdId: membership.householdId,
            plannedFor: { gte: targetStart, lte: targetEnd },
          },
        });
      let createdCount = 0;
      for (const entry of source) {
        const offset = Math.round(
          (entry.plannedFor.getTime() - sourceStart.getTime()) / 86_400_000,
        );
        const plannedFor = new Date(targetStart);
        plannedFor.setUTCDate(plannedFor.getUTCDate() + offset);
        const existing = await tx.mealPlanEntry.count({
          where: {
            householdId: membership.householdId,
            plannedFor,
            mealType: entry.mealType,
          },
        });
        if (existing && !input.replaceExisting) continue;
        await tx.mealPlanEntry.create({
          data: {
            householdId: membership.householdId,
            plannedFor,
            mealType: entry.mealType,
            customMealTypeLabel: entry.customMealTypeLabel,
            recipeId: entry.recipeId,
            title: entry.title,
            servings: entry.servings,
            notes: entry.notes,
            createdByUserId: userId,
            updatedByUserId: userId,
            participants: {
              create: entry.participants.map(
                ({ userId: participantUserId }) => ({
                  userId: participantUserId,
                  createdByUserId: userId,
                }),
              ),
            },
          },
        });
        createdCount += 1;
      }
      await this.audit.record(tx, {
        action: 'MEAL_PLAN_WEEK_COPIED',
        householdId: membership.householdId,
        userId,
        metadata: { createdCount, replaced: input.replaceExisting },
      });
      return { createdCount, skippedCount: source.length - createdCount };
    });
    return result;
  }

  private data(input: MealPlanInputDto) {
    const servings = decimalQuantity(input.servings, 'Počet porcí');
    if (servings.lte(0)) throw mealsInvalid('Počet porcí musí být kladný.');
    if (input.mealType === 'OTHER' && !input.customMealTypeLabel)
      throw mealsInvalid('Vlastní typ jídla vyžaduje název.');
    return {
      plannedFor: dateOnly(input.plannedFor),
      mealType: input.mealType,
      customMealTypeLabel: optionalText(input.customMealTypeLabel),
      recipeId: input.recipeId ?? null,
      title: input.title.trim(),
      servings,
      notes: optionalText(input.notes),
    };
  }

  private async verify(householdId: string, input: MealPlanInputDto) {
    await this.access.assertActiveMembers(
      householdId,
      input.participantUserIds,
    );
    if (input.recipeId) {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: input.recipeId, householdId },
        select: { id: true },
      });
      if (!recipe) throw mealsNotFound();
    }
  }

  private async find(
    householdId: string,
    entryId: string,
  ): Promise<MealEntryRecord> {
    const entry = await this.prisma.mealPlanEntry.findFirst({
      where: { id: entryId, householdId },
      include: mealEntryInclude,
    });
    if (!entry) throw mealsNotFound();
    return entry;
  }
}
