import { Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { FinanceLedgerFacade } from '../../finance/finance-ledger.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { PrismaMaintenanceCategoryRepository } from '../infrastructure/prisma-maintenance-category.repository.js';
import {
  maintenanceInvalid,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';

@Injectable()
export class MaintenanceValidationService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly categories: PrismaMaintenanceCategoryRepository,
    private readonly documents: DocumentsFacade,
    private readonly finance: FinanceLedgerFacade,
  ) {}

  public async planReferences(
    householdId: string,
    input: {
      categoryId?: string | null;
      responsibleUserId?: string | null;
      defaultCostMinor?: string | null;
      defaultCurrencyCode?: string | null;
    },
  ) {
    if (input.categoryId) {
      const category = await this.categories.find(
        householdId,
        input.categoryId,
      );
      if (!category || category.archivedAt) throw maintenanceNotFound();
    }
    if (input.responsibleUserId)
      await this.access.assertActiveMembers(householdId, [
        input.responsibleUserId,
      ]);
    this.money(input.defaultCostMinor, input.defaultCurrencyCode);
  }

  public money(amount?: string | null, currency?: string | null) {
    if (Boolean(amount) !== Boolean(currency))
      throw maintenanceInvalid('Cena a měna musí být zadané společně.');
    if (amount && BigInt(amount) < 0n)
      throw maintenanceInvalid('Cena nesmí být záporná.');
  }

  public async documentIds(userId: string, ids: readonly string[]) {
    return this.documents.verifyAccessibleSummaries(userId, ids);
  }

  public async transactionIds(userId: string, ids: readonly string[]) {
    return this.finance.verifyAccessibleTransactionSummaries(userId, ids);
  }
}
