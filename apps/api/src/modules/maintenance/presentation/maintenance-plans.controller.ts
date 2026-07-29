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
import { MaintenancePlansService } from '../application/maintenance-plans.service.js';
import {
  CreateMaintenancePlanDto,
  ListMaintenancePlansQueryDto,
  UpdateMaintenancePlanDto,
} from './dto/maintenance.dto.js';

@Controller('maintenance/plans')
export class MaintenancePlansController {
  public constructor(private readonly plans: MaintenancePlansService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListMaintenancePlansQueryDto,
  ) {
    return this.plans.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateMaintenancePlanDto,
  ) {
    return this.plans.create(principal.userId, input);
  }

  @Get(':planId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
  ) {
    return this.plans.detail(principal.userId, planId);
  }

  @Patch(':planId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
    @Body() input: UpdateMaintenancePlanDto,
  ) {
    return this.plans.update(principal.userId, planId, input);
  }

  @Post(':planId/pause')
  public pause(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
  ) {
    return this.plans.transition(principal.userId, planId, 'pause');
  }

  @Post(':planId/resume')
  public resume(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
  ) {
    return this.plans.transition(principal.userId, planId, 'resume');
  }

  @Post(':planId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
  ) {
    return this.plans.transition(principal.userId, planId, 'archive');
  }

  @Post(':planId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('planId', new ParseUUIDPipe({ version: '4' })) planId: string,
  ) {
    return this.plans.transition(principal.userId, planId, 'restore');
  }
}
