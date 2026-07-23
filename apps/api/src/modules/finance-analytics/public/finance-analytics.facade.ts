import { Injectable } from '@nestjs/common';
import { FinanceAnalyticsQueryService } from '../application/finance-analytics-query.service.js';

export interface FinanceExpenseHistoryRequest {
  from: Date;
  to: Date;
  currencyCode?: 'CZK' | 'EUR';
}

@Injectable()
export class FinanceAnalyticsFacade {
  public constructor(private readonly query: FinanceAnalyticsQueryService) {}

  public loadExpenseHistory(
    userId: string,
    request: FinanceExpenseHistoryRequest,
  ) {
    return this.query.load(
      userId,
      {
        includeCreditCards: true,
        ...(request.currencyCode ? { currencyCode: request.currencyCode } : {}),
      },
      { from: request.from, to: request.to },
    );
  }
}
