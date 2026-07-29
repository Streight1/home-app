import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MaintenanceCompletionService } from '../application/maintenance-completion.service.js';
import { MaintenanceOccurrencesService } from '../application/maintenance-occurrences.service.js';
import { MaintenanceTaskService } from '../application/maintenance-task.service.js';
import {
  CompleteMaintenanceOccurrenceDto,
  ListMaintenanceOccurrencesQueryDto,
  RescheduleMaintenanceOccurrenceDto,
  SetMaintenanceDocumentsDto,
  SetMaintenanceTransactionsDto,
  SkipMaintenanceOccurrenceDto,
} from './dto/maintenance.dto.js';

@Controller('maintenance/occurrences')
export class MaintenanceOccurrencesController {
  public constructor(
    private readonly occurrences: MaintenanceOccurrencesService,
    private readonly completion: MaintenanceCompletionService,
    private readonly tasks: MaintenanceTaskService,
  ) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListMaintenanceOccurrencesQueryDto,
  ) {
    return this.occurrences.list(principal.userId, query);
  }

  @Post(':occurrenceId/complete')
  public complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() input: CompleteMaintenanceOccurrenceDto,
  ) {
    return this.completion.complete(principal.userId, occurrenceId, input);
  }

  @Post(':occurrenceId/skip')
  public skip(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() input: SkipMaintenanceOccurrenceDto,
  ) {
    return this.occurrences.skip(principal.userId, occurrenceId, input);
  }

  @Post(':occurrenceId/reschedule')
  public reschedule(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() input: RescheduleMaintenanceOccurrenceDto,
  ) {
    return this.occurrences.reschedule(principal.userId, occurrenceId, input);
  }

  @Post(':occurrenceId/task')
  public createTask(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
  ) {
    return this.tasks.create(principal.userId, occurrenceId);
  }

  @Put(':occurrenceId/documents')
  public setDocuments(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() input: SetMaintenanceDocumentsDto,
  ) {
    return this.occurrences.setDocuments(principal.userId, occurrenceId, input);
  }

  @Put(':occurrenceId/transactions')
  public setTransactions(
    @CurrentUser() principal: SessionPrincipal,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() input: SetMaintenanceTransactionsDto,
  ) {
    return this.occurrences.setTransactions(
      principal.userId,
      occurrenceId,
      input,
    );
  }
}
