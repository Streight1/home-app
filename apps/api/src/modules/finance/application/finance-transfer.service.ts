import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { FINANCE_WRITE_ROLE } from '../domain/finance-access.policy.js';
import { financeInvalid, financeNotFound } from '../domain/finance.errors.js';
import { validateTransferAccounts } from '../domain/ledger-rules.js';
import { PrismaFinancialAccountRepository } from '../infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialTransferRepository } from '../infrastructure/prisma-financial-transfer.repository.js';
import type {
  CreateFinancialTransferDto,
  UpdateFinancialTransferDto,
} from '../presentation/dto/financial-transfer.dto.js';

@Injectable()
export class FinanceTransferService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly accounts: PrismaFinancialAccountRepository,
    private readonly transfers: PrismaFinancialTransferRepository,
  ) {}

  public async create(userId: string, input: CreateFinancialTransferDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const currencyCode = await this.validateAccounts(
      membership.householdId,
      input,
    );
    const id = await this.transfers.create({
      householdId: membership.householdId,
      userId,
      currencyCode,
      data: input,
    });
    return { id };
  }

  public async update(
    userId: string,
    transferId: string,
    input: UpdateFinancialTransferDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const currencyCode = await this.validateAccounts(
      membership.householdId,
      input,
    );
    if (
      !(await this.transfers.update({
        householdId: membership.householdId,
        userId,
        transferId,
        currencyCode,
        data: input,
      }))
    ) {
      throw financeNotFound();
    }
    return { id: transferId };
  }

  public async delete(userId: string, transferId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (
      !(await this.transfers.softDelete(
        membership.householdId,
        userId,
        transferId,
      ))
    ) {
      throw financeNotFound();
    }
  }

  private async validateAccounts(
    householdId: string,
    input: CreateFinancialTransferDto | UpdateFinancialTransferDto,
  ) {
    if (input.fromAccountId === input.toAccountId) {
      throw financeInvalid('Zdrojový a cílový účet musí být rozdílný.');
    }
    const [fromAccount, toAccount] = await Promise.all([
      this.accounts.findRecord(householdId, input.fromAccountId),
      this.accounts.findRecord(householdId, input.toAccountId),
    ]);
    if (!fromAccount || !toAccount) throw financeNotFound();
    return validateTransferAccounts(fromAccount, toAccount);
  }
}
