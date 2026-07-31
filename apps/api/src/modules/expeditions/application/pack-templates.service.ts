import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  expeditionsInvalid,
  expeditionsNotFound,
} from '../domain/expeditions.errors.js';
import {
  DECIMAL_QUANTITY_PATTERN,
  EXPEDITIONS_ADMIN_ROLE,
  EXPEDITIONS_READ_ROLE,
  EXPEDITIONS_WRITE_ROLE,
  optionalText,
} from '../domain/expeditions.types.js';
import type {
  PackTemplateInputDto,
  PackTemplateItemInputDto,
} from '../presentation/dto/pack-template.dto.js';
import {
  mapTemplate,
  packTemplateInclude,
} from './expeditions-response.mapper.js';

interface ResolvedTemplateItem {
  gearItemId: string | null;
  nameSnapshot: string;
  customName: string | null;
  categoryId: string | null;
  categoryNameSnapshot: string | null;
  quantityDecimal: Prisma.Decimal;
  unitWeightGramsSnapshot: number;
  loadType: 'CARRIED' | 'WORN' | 'CONSUMABLE';
  criticality: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  isShared: boolean;
  defaultAssignedUserId: string | null;
  packLocationLabel: string | null;
  notes: string | null;
  sortOrder: number;
}

@Injectable()
export class PackTemplatesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    return (
      await this.prisma.packTemplate.findMany({
        where: { householdId: membership.householdId, archivedAt: null },
        include: packTemplateInclude,
        orderBy: { updatedAt: 'desc' },
      })
    ).map(mapTemplate);
  }

  public async detail(userId: string, templateId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    return mapTemplate(await this.find(membership.householdId, templateId));
  }

  public async create(userId: string, input: PackTemplateInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const items = await this.resolveItems(membership.householdId, input.items);
    const record = await this.prisma.$transaction(async (tx) => {
      const template = await tx.packTemplate.create({
        data: {
          householdId: membership.householdId,
          ...this.data(input),
          createdByUserId: userId,
          updatedByUserId: userId,
          items: { create: items },
        },
        include: packTemplateInclude,
      });
      await this.audit.record(tx, {
        action: 'PACK_TEMPLATE_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'PackTemplate',
        entityId: template.id,
        metadata: { itemCount: items.length },
      });
      return template;
    });
    return mapTemplate(record);
  }

  public async update(
    userId: string,
    templateId: string,
    input: PackTemplateInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, templateId);
    const items = await this.resolveItems(membership.householdId, input.items);
    return this.prisma.$transaction(async (tx) => {
      await tx.packTemplateItem.deleteMany({
        where: { packTemplateId: templateId },
      });
      const template = await tx.packTemplate.update({
        where: { id: templateId },
        data: {
          ...this.data(input),
          updatedByUserId: userId,
          items: { create: items },
        },
        include: packTemplateInclude,
      });
      await this.audit.record(tx, {
        action: 'PACK_TEMPLATE_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'PackTemplate',
        entityId: templateId,
        metadata: { itemCount: items.length },
      });
      return mapTemplate(template);
    });
  }

  public async replaceItems(
    userId: string,
    templateId: string,
    inputs: PackTemplateItemInputDto[],
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, templateId);
    const items = await this.resolveItems(membership.householdId, inputs);
    return this.prisma.$transaction(async (tx) => {
      await tx.packTemplateItem.deleteMany({
        where: { packTemplateId: templateId },
      });
      await tx.packTemplateItem.createMany({
        data: items.map((item) => ({ packTemplateId: templateId, ...item })),
      });
      const template = await tx.packTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: packTemplateInclude,
      });
      await this.audit.record(tx, {
        action: 'PACK_TEMPLATE_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'PackTemplate',
        entityId: templateId,
        metadata: { itemCount: items.length },
      });
      return mapTemplate(template);
    });
  }

  public async duplicate(userId: string, templateId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const source = await this.find(membership.householdId, templateId);
    const duplicate = await this.prisma.packTemplate.create({
      data: {
        householdId: membership.householdId,
        name: `${source.name} – kopie`,
        description: source.description,
        tripType: source.tripType,
        seasonLabel: source.seasonLabel,
        targetBaseWeightGrams: source.targetBaseWeightGrams,
        defaultParticipantCount: source.defaultParticipantCount,
        createdByUserId: userId,
        updatedByUserId: userId,
        items: {
          create: source.items.map((item) => ({
            gearItemId: item.gearItemId,
            nameSnapshot: item.nameSnapshot,
            customName: item.customName,
            categoryId: item.categoryId,
            categoryNameSnapshot: item.categoryNameSnapshot,
            quantityDecimal: item.quantityDecimal,
            unitWeightGramsSnapshot: item.unitWeightGramsSnapshot,
            loadType: item.loadType,
            criticality: item.criticality,
            isShared: item.isShared,
            defaultAssignedUserId: item.defaultAssignedUserId,
            packLocationLabel: item.packLocationLabel,
            notes: item.notes,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: packTemplateInclude,
    });
    return mapTemplate(duplicate);
  }

  public async setArchived(
    userId: string,
    templateId: string,
    archived: boolean,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    await this.find(membership.householdId, templateId);
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.packTemplate.update({
        where: { id: templateId },
        data: {
          archivedAt: archived ? new Date() : null,
          updatedByUserId: userId,
        },
        include: packTemplateInclude,
      });
      await this.audit.record(tx, {
        action: 'PACK_TEMPLATE_ARCHIVED',
        householdId: membership.householdId,
        userId,
        entityType: 'PackTemplate',
        entityId: templateId,
      });
      return mapTemplate(template);
    });
  }

  public async catalogUpdatePreview(userId: string, templateId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const template = await this.find(membership.householdId, templateId);
    const gear = await this.prisma.gearItem.findMany({
      where: {
        householdId: membership.householdId,
        id: {
          in: template.items.flatMap(({ gearItemId }) =>
            gearItemId ? [gearItemId] : [],
          ),
        },
      },
      include: { category: true },
    });
    const byId = new Map(gear.map((item) => [item.id, item]));
    return {
      changes: template.items.flatMap((item) => {
        if (!item.gearItemId) return [];
        const current = byId.get(item.gearItemId);
        if (!current) return [];
        const changed =
          current.name !== item.nameSnapshot ||
          current.weightGrams !== item.unitWeightGramsSnapshot ||
          current.category?.name !== item.categoryNameSnapshot;
        return changed
          ? [
              {
                itemId: item.id,
                name: {
                  before: item.nameSnapshot,
                  after: current.name,
                },
                weightGrams: {
                  before: item.unitWeightGramsSnapshot,
                  after: current.weightGrams,
                },
                categoryName: {
                  before: item.categoryNameSnapshot,
                  after: current.category?.name ?? null,
                },
              },
            ]
          : [];
      }),
    };
  }

  public async applyCatalogUpdate(
    userId: string,
    templateId: string,
    confirmed: boolean,
  ) {
    if (!confirmed)
      throw expeditionsInvalid('Aktualizace snapshotů vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, templateId);
    const linked = await this.prisma.packTemplateItem.findMany({
      where: { packTemplateId: templateId, gearItemId: { not: null } },
      include: { gearItem: { include: { category: true } } },
    });
    await this.prisma.$transaction(
      linked.flatMap((item) =>
        item.gearItem
          ? [
              this.prisma.packTemplateItem.update({
                where: { id: item.id },
                data: {
                  nameSnapshot: item.gearItem.name,
                  categoryId: item.gearItem.categoryId,
                  categoryNameSnapshot: item.gearItem.category?.name ?? null,
                  unitWeightGramsSnapshot: item.gearItem.weightGrams,
                },
              }),
            ]
          : [],
      ),
    );
    return this.detail(userId, templateId);
  }

  public async find(householdId: string, templateId: string) {
    const template = await this.prisma.packTemplate.findFirst({
      where: { id: templateId, householdId },
      include: packTemplateInclude,
    });
    if (!template) throw expeditionsNotFound();
    return template;
  }

  private data(input: PackTemplateInputDto) {
    return {
      name: input.name.trim(),
      description: optionalText(input.description),
      tripType: input.tripType,
      seasonLabel: optionalText(input.seasonLabel),
      targetBaseWeightGrams: input.targetBaseWeightGrams ?? null,
      defaultParticipantCount: input.defaultParticipantCount,
    };
  }

  private async resolveItems(
    householdId: string,
    inputs: PackTemplateItemInputDto[],
  ): Promise<ResolvedTemplateItem[]> {
    const gearIds = [
      ...new Set(
        inputs.flatMap(({ gearItemId }) => (gearItemId ? [gearItemId] : [])),
      ),
    ];
    const categoryIds = [
      ...new Set(
        inputs.flatMap(({ categoryId }) => (categoryId ? [categoryId] : [])),
      ),
    ];
    const assigneeIds = [
      ...new Set(
        inputs.flatMap(({ defaultAssignedUserId }) =>
          defaultAssignedUserId ? [defaultAssignedUserId] : [],
        ),
      ),
    ];
    const [gear, categories] = await Promise.all([
      this.prisma.gearItem.findMany({
        where: { householdId, id: { in: gearIds }, archivedAt: null },
        include: { category: true },
      }),
      this.prisma.gearCategory.findMany({
        where: { householdId, id: { in: categoryIds }, archivedAt: null },
      }),
    ]);
    if (
      gear.length !== gearIds.length ||
      categories.length !== categoryIds.length
    )
      throw expeditionsNotFound();
    await this.access.assertActiveMembers(householdId, assigneeIds);
    const gearById = new Map(gear.map((item) => [item.id, item]));
    const categoryById = new Map(categories.map((item) => [item.id, item]));
    return inputs.map((input, sortOrder) => {
      const source = input.gearItemId ? gearById.get(input.gearItemId) : null;
      const category = input.categoryId
        ? categoryById.get(input.categoryId)
        : source?.category;
      const name = source?.name ?? input.customName?.trim();
      if (!name)
        throw expeditionsInvalid(
          'Položka šablony musí odkazovat na výbavu nebo mít vlastní název.',
        );
      if (!DECIMAL_QUANTITY_PATTERN.test(input.quantity))
        throw expeditionsInvalid('Množství položky není platné.');
      const quantity = new Prisma.Decimal(input.quantity);
      if (quantity.lte(0))
        throw expeditionsInvalid('Množství položky musí být kladné.');
      return {
        gearItemId: source?.id ?? null,
        nameSnapshot: name,
        customName: source ? null : name,
        categoryId: category?.id ?? null,
        categoryNameSnapshot: category?.name ?? null,
        quantityDecimal: quantity,
        unitWeightGramsSnapshot: source?.weightGrams ?? input.unitWeightGrams,
        loadType: source?.defaultLoadType ?? input.loadType,
        criticality: source?.defaultCriticality ?? input.criticality,
        isShared: input.isShared,
        defaultAssignedUserId: input.defaultAssignedUserId ?? null,
        packLocationLabel: optionalText(input.packLocationLabel),
        notes: optionalText(input.notes),
        sortOrder,
      };
    });
  }
}
