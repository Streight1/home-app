import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceLedgerService } from '../application/finance-ledger.service.js';
import {
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDocumentsDto,
  UpdateFinancialTransactionDto,
} from './dto/financial-transaction.dto.js';
import { ListFinancialTransactionsDto } from './dto/list-financial-transactions.dto.js';

@Controller('finance/transactions')
export class FinancialTransactionsController {
  public constructor(private readonly ledger: FinanceLedgerService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListFinancialTransactionsDto,
  ) {
    return this.ledger.list(principal.userId, query);
  }

  @Post('expense')
  public expense(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFinancialTransactionDto,
  ) {
    return this.ledger.create(principal.userId, 'EXPENSE', input);
  }

  @Post('income')
  public income(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFinancialTransactionDto,
  ) {
    return this.ledger.create(principal.userId, 'INCOME', input);
  }

  @Get(':transactionId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transactionId', new ParseUUIDPipe({ version: '4' }))
    transactionId: string,
  ) {
    return this.ledger.detail(principal.userId, transactionId);
  }

  @Patch(':transactionId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transactionId', new ParseUUIDPipe({ version: '4' }))
    transactionId: string,
    @Body() input: UpdateFinancialTransactionDto,
  ) {
    return this.ledger.update(principal.userId, transactionId, input);
  }

  @Put(':transactionId/documents')
  public documents(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transactionId', new ParseUUIDPipe({ version: '4' }))
    transactionId: string,
    @Body() input: UpdateFinancialTransactionDocumentsDto,
  ) {
    return this.ledger.replaceDocuments(principal.userId, transactionId, input);
  }

  @Delete(':transactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transactionId', new ParseUUIDPipe({ version: '4' }))
    transactionId: string,
  ) {
    await this.ledger.delete(principal.userId, transactionId);
  }
}
