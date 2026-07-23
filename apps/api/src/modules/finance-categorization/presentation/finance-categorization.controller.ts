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
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceCategorizationService } from '../application/finance-categorization.service.js';
import {
  BulkCategorizeDto,
  CreateCategorizationRuleDto,
  UpdateCategorizationRuleDto,
} from './dto/categorization-rule.dto.js';

@Controller('finance/categorization-rules')
export class FinanceCategorizationController {
  public constructor(private readonly service: FinanceCategorizationService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.service.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateCategorizationRuleDto,
  ) {
    return this.service.create(principal.userId, input);
  }

  @Patch(':ruleId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
    @Body() input: UpdateCategorizationRuleDto,
  ) {
    return this.service.update(principal.userId, ruleId, input);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
  ): Promise<void> {
    return this.service.delete(principal.userId, ruleId);
  }

  @Post('bulk-apply')
  public bulk(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: BulkCategorizeDto,
  ) {
    return this.service.bulkCategorize(principal.userId, input);
  }
}
