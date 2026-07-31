import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { DocumentsFacade } from '../../documents/documents.facade.js';
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
  normalizeGearName,
  optionalText,
} from '../domain/expeditions.types.js';
import type {
  GearDocumentInputDto,
  GearItemInputDto,
  ListGearQueryDto,
} from '../presentation/dto/gear.dto.js';
import { gearListInclude, mapGear } from './expeditions-response.mapper.js';

@Injectable()
export class GearService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly documents: DocumentsFacade,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string, query: ListGearQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const where: Prisma.GearItemWhereInput = {
      householdId: membership.householdId,
      archivedAt: query.archived ? { not: null } : null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.query
        ? {
            OR: [
              { name: { contains: query.query, mode: 'insensitive' } },
              { brand: { contains: query.query, mode: 'insensitive' } },
              { model: { contains: query.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [totalItems, records] = await this.prisma.$transaction([
      this.prisma.gearItem.count({ where }),
      this.prisma.gearItem.findMany({
        where,
        include: gearListInclude,
        orderBy: [{ archivedAt: 'asc' }, { normalizedName: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: records.map(mapGear),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  public async detail(userId: string, gearItemId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    const record = await this.find(membership.householdId, gearItemId);
    const linked = await this.prisma.gearItemDocument.findMany({
      where: { gearItemId },
      orderBy: [{ isCover: 'desc' }, { createdAt: 'asc' }],
    });
    const summaries = await this.documents.verifyAccessibleSummaries(
      userId,
      linked.map(({ documentId }) => documentId),
    );
    const byId = new Map(summaries.map((summary) => [summary.id, summary]));
    return {
      ...mapGear(record),
      documents: linked.flatMap((link) => {
        const summary = byId.get(link.documentId);
        return summary
          ? [
              {
                ...summary,
                relationType: link.relationType,
                isCover: link.isCover,
              },
            ]
          : [];
      }),
    };
  }

  public async create(userId: string, input: GearItemInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.validate(userId, membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      const item = await tx.gearItem.create({
        data: {
          householdId: membership.householdId,
          ...this.data(input),
          createdByUserId: userId,
          updatedByUserId: userId,
          documents: { create: this.documentData(userId, input.documents) },
        },
        include: gearListInclude,
      });
      await this.audit.record(tx, {
        action: 'GEAR_ITEM_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearItem',
        entityId: item.id,
      });
      return item;
    });
    return mapGear(record);
  }

  public async update(
    userId: string,
    gearItemId: string,
    input: GearItemInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, gearItemId);
    await this.validate(userId, membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.gearItemDocument.deleteMany({ where: { gearItemId } });
      const item = await tx.gearItem.update({
        where: { id: gearItemId },
        data: {
          ...this.data(input),
          updatedByUserId: userId,
          documents: { create: this.documentData(userId, input.documents) },
        },
        include: gearListInclude,
      });
      await this.audit.record(tx, {
        action: 'GEAR_ITEM_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearItem',
        entityId: gearItemId,
      });
      return item;
    });
    return mapGear(record);
  }

  public async setArchived(
    userId: string,
    gearItemId: string,
    archived: boolean,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    await this.find(membership.householdId, gearItemId);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.gearItem.update({
        where: { id: gearItemId },
        data: {
          archivedAt: archived ? new Date() : null,
          updatedByUserId: userId,
        },
        include: gearListInclude,
      });
      await this.audit.record(tx, {
        action: archived ? 'GEAR_ITEM_ARCHIVED' : 'GEAR_ITEM_RESTORED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearItem',
        entityId: gearItemId,
      });
      return mapGear(item);
    });
  }

  public async replaceDocuments(
    userId: string,
    gearItemId: string,
    documents: GearDocumentInputDto[],
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    await this.find(membership.householdId, gearItemId);
    await this.validateDocuments(userId, documents);
    await this.prisma.$transaction(async (tx) => {
      await tx.gearItemDocument.deleteMany({ where: { gearItemId } });
      await tx.gearItemDocument.createMany({
        data: this.documentData(userId, documents).map((document) => ({
          gearItemId,
          ...document,
        })),
      });
    });
    return this.detail(userId, gearItemId);
  }

  public async find(householdId: string, gearItemId: string) {
    const item = await this.prisma.gearItem.findFirst({
      where: { id: gearItemId, householdId },
      include: gearListInclude,
    });
    if (!item) throw expeditionsNotFound();
    return item;
  }

  private data(input: GearItemInputDto) {
    if (!DECIMAL_QUANTITY_PATTERN.test(input.defaultQuantity))
      throw expeditionsInvalid('Výchozí množství není platné.');
    const quantity = new Prisma.Decimal(input.defaultQuantity);
    if (quantity.lte(0))
      throw expeditionsInvalid('Výchozí množství musí být kladné.');
    return {
      categoryId: input.categoryId ?? null,
      name: input.name.trim(),
      normalizedName: normalizeGearName(input.name),
      brand: optionalText(input.brand),
      model: optionalText(input.model),
      description: optionalText(input.description),
      notes: optionalText(input.notes),
      weightGrams: input.weightGrams,
      weightStatus: input.weightStatus,
      defaultLoadType: input.defaultLoadType,
      defaultCriticality: input.defaultCriticality,
      ownerUserId: input.ownerUserId ?? null,
      isHouseholdShared: input.isHouseholdShared,
      defaultQuantityDecimal: quantity,
      purchaseUrl: optionalText(input.purchaseUrl),
      productUrl: optionalText(input.productUrl),
    };
  }

  private async validate(
    userId: string,
    householdId: string,
    input: GearItemInputDto,
  ) {
    if (input.weightGrams === 0 && input.weightStatus !== 'UNKNOWN')
      throw expeditionsInvalid(
        'Nulová hmotnost musí být označená jako neznámá.',
      );
    if (input.categoryId) {
      const count = await this.prisma.gearCategory.count({
        where: { id: input.categoryId, householdId, archivedAt: null },
      });
      if (count !== 1) throw expeditionsNotFound();
    }
    if (input.ownerUserId)
      await this.access.assertActiveMembers(householdId, [input.ownerUserId]);
    await this.validateDocuments(userId, input.documents);
  }

  private async validateDocuments(
    userId: string,
    documents: GearDocumentInputDto[],
  ) {
    if (documents.filter(({ isCover }) => isCover).length > 1)
      throw expeditionsInvalid('Výbava může mít jen jednu titulní fotografii.');
    await this.documents.verifyAccessibleSummaries(
      userId,
      documents.map(({ documentId }) => documentId),
    );
  }

  private documentData(userId: string, documents: GearDocumentInputDto[]) {
    return documents.map((document) => ({
      documentId: document.documentId,
      relationType: document.relationType,
      isCover: document.isCover,
      createdByUserId: userId,
    }));
  }
}
