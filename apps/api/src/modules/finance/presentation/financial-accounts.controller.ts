import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceCatalogService } from '../application/finance-catalog.service.js';
import {
  CreateFinancialAccountDto,
  UpdateFinancialAccountDto,
} from './dto/financial-account.dto.js';
import { FinanceCatalogQueryDto } from './dto/finance-catalog-query.dto.js';

@Controller('finance/accounts')
export class FinancialAccountsController {
  public constructor(private readonly catalog: FinanceCatalogService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: FinanceCatalogQueryDto,
  ) {
    return this.catalog.listAccounts(principal.userId, query.includeArchived);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFinancialAccountDto,
  ) {
    return this.catalog.createAccount(principal.userId, input);
  }

  @Get(':accountId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ) {
    return this.catalog.accountDetail(principal.userId, accountId);
  }

  @Patch(':accountId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() input: UpdateFinancialAccountDto,
  ) {
    return this.catalog.updateAccount(principal.userId, accountId, input);
  }

  @Post(':accountId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ) {
    return this.catalog.setAccountArchived(principal.userId, accountId, true);
  }

  @Post(':accountId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ) {
    return this.catalog.setAccountArchived(principal.userId, accountId, false);
  }
}
