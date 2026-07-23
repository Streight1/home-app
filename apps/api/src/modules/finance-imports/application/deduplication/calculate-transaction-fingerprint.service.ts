import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculateTransactionFingerprintService {
  public calculate(input: {
    accountId: string;
    bookedDate: string;
    transactionDate: string | null;
    amountMinor: bigint;
    currencyCode: string;
    counterpartyName: string | null;
    counterpartyAccount: string | null;
    variableSymbol: string | null;
    description: string | null;
  }): string {
    return createHash('sha256')
      .update(
        [
          input.accountId,
          input.bookedDate,
          input.transactionDate ?? '',
          input.amountMinor.toString(),
          input.currencyCode,
          normalize(input.counterpartyName),
          normalize(input.counterpartyAccount),
          normalize(input.variableSymbol),
          normalize(input.description),
        ].join('\u001f'),
      )
      .digest('hex');
  }
}

const normalize = (value: string | null): string =>
  (value ?? '').trim().toLocaleLowerCase('cs-CZ').replace(/\s+/g, ' ');
