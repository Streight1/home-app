import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceTransferService } from '../application/finance-transfer.service.js';
import {
  CreateFinancialTransferDto,
  UpdateFinancialTransferDto,
} from './dto/financial-transfer.dto.js';

@Controller('finance/transfers')
export class FinancialTransfersController {
  public constructor(private readonly transfers: FinanceTransferService) {}

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFinancialTransferDto,
  ) {
    return this.transfers.create(principal.userId, input);
  }

  @Patch(':transferId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transferId', new ParseUUIDPipe({ version: '4' }))
    transferId: string,
    @Body() input: UpdateFinancialTransferDto,
  ) {
    return this.transfers.update(principal.userId, transferId, input);
  }

  @Delete(':transferId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('transferId', new ParseUUIDPipe({ version: '4' }))
    transferId: string,
  ) {
    await this.transfers.delete(principal.userId, transferId);
  }
}
