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
import { RecurringExpensesService } from '../application/recurring-expenses.service.js';
import {
  ListRecurringQueryDto,
  UpdateRecurringExpenseDto,
} from './dto/insights.dto.js';

@Controller('finance')
export class RecurringExpensesController {
  public constructor(private readonly recurring: RecurringExpensesService) {}

  @Get('recurring-expenses')
  public expenses(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListRecurringQueryDto,
  ) {
    return this.recurring.listExpenses(principal.userId, query);
  }

  @Get('recurring-candidates')
  public candidates(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListRecurringQueryDto,
  ) {
    return this.recurring.listCandidates(principal.userId, query);
  }

  @Post('recurring-candidates/:candidateId/confirm')
  public confirm(
    @CurrentUser() principal: SessionPrincipal,
    @Param('candidateId', new ParseUUIDPipe({ version: '4' }))
    candidateId: string,
  ) {
    return this.recurring.confirm(principal.userId, candidateId);
  }

  @Post('recurring-candidates/:candidateId/dismiss')
  public dismiss(
    @CurrentUser() principal: SessionPrincipal,
    @Param('candidateId', new ParseUUIDPipe({ version: '4' }))
    candidateId: string,
  ) {
    return this.recurring.dismiss(principal.userId, candidateId);
  }

  @Patch('recurring-expenses/:recurringExpenseId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recurringExpenseId', new ParseUUIDPipe({ version: '4' }))
    id: string,
    @Body() input: UpdateRecurringExpenseDto,
  ) {
    return this.recurring.update(principal.userId, id, input);
  }

  @Post('recurring-expenses/:recurringExpenseId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recurringExpenseId', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.recurring.archive(principal.userId, id);
  }
}
