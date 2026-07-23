import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../../audit/audit.service.js';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import { financeImportNotFound } from '../../domain/finance-import.errors.js';
import { PrismaFinanceImportProfileRepository } from '../../infrastructure/prisma-finance-import-profile.repository.js';
import type {
  CreateImportProfileDto,
  UpdateImportProfileDto,
} from '../../presentation/dto/import-profile.dto.js';
import { financeImportFields } from '../../domain/finance-import.types.js';
import { financeImportInvalid } from '../../domain/finance-import.errors.js';

@Injectable()
export class ImportProfileService {
  public constructor(
    private readonly profiles: PrismaFinanceImportProfileRepository,
    private readonly ledger: FinanceLedgerFacade,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const scope = await this.ledger.getAccountForCurrentHousehold(userId);
    return { items: await this.profiles.list(scope.householdId) };
  }

  public async create(userId: string, input: CreateImportProfileDto) {
    const scope = await this.ledger.getAccountForCurrentHousehold(userId, true);
    validateProfile(input);
    if (input.accountId) {
      const account = await this.ledger.getAccount(
        userId,
        input.accountId,
        true,
      );
      if (account.householdId !== scope.householdId)
        throw financeImportNotFound();
      validateSourceKind(account.type, input.sourceKind);
    }
    const profile = await this.profiles.create(
      scope.householdId,
      userId,
      input,
    );
    await this.record(
      'FINANCE_IMPORT_PROFILE_CREATED',
      scope.householdId,
      userId,
      profile.id,
      input.accountId ?? null,
    );
    return profile;
  }

  public async update(
    userId: string,
    profileId: string,
    input: UpdateImportProfileDto,
  ) {
    const scope = await this.ledger.getAccountForCurrentHousehold(userId, true);
    validateProfile(input);
    if (input.accountId) {
      const account = await this.ledger.getAccount(
        userId,
        input.accountId,
        true,
      );
      validateSourceKind(account.type, input.sourceKind);
    }
    const profile = await this.profiles.update(
      scope.householdId,
      profileId,
      input,
    );
    if (!profile) throw financeImportNotFound();
    await this.record(
      'FINANCE_IMPORT_PROFILE_UPDATED',
      scope.householdId,
      userId,
      profileId,
      input.accountId ?? null,
    );
    return profile;
  }

  public async delete(userId: string, profileId: string): Promise<void> {
    const scope = await this.ledger.getAccountForCurrentHousehold(userId, true);
    const result = await this.profiles.delete(scope.householdId, profileId);
    if (result.count === 0) throw financeImportNotFound();
    await this.record(
      'FINANCE_IMPORT_PROFILE_DELETED',
      scope.householdId,
      userId,
      profileId,
      null,
    );
  }

  private async record(
    action:
      | 'FINANCE_IMPORT_PROFILE_CREATED'
      | 'FINANCE_IMPORT_PROFILE_UPDATED'
      | 'FINANCE_IMPORT_PROFILE_DELETED',
    householdId: string,
    userId: string,
    profileId: string,
    accountId: string | null,
  ): Promise<void> {
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action,
        householdId,
        userId,
        entityType: 'FinanceImportProfile',
        entityId: profileId,
        metadata: { profileId, accountId },
      }),
    );
  }
}

function validateProfile(input: CreateImportProfileDto): void {
  if (input.decimalSeparator === input.thousandSeparator)
    throw financeImportInvalid(
      'Oddělovač desetinných míst a tisíců musí být odlišný.',
    );
  if (
    Object.keys(input.columnMapping).some(
      (key) => !financeImportFields.includes(key as never),
    )
  )
    throw financeImportInvalid('Profil obsahuje neznámé mapované pole.');
  if (!input.columnMapping.bookedDate && !input.columnMapping.transactionDate)
    throw financeImportInvalid('Profil musí mapovat datum pohybu.');
  if (
    input.amountColumnMode === 'SEPARATE_DEBIT_CREDIT'
      ? !input.columnMapping.debitAmount && !input.columnMapping.creditAmount
      : !input.columnMapping.signedAmount
  )
    throw financeImportInvalid('Profil musí mapovat částku pohybu.');
}

function validateSourceKind(accountType: string, sourceKind: string): void {
  if ((accountType === 'CREDIT_CARD') !== (sourceKind === 'CREDIT_CARD'))
    throw financeImportInvalid('Typ profilu neodpovídá vybranému účtu.');
}
