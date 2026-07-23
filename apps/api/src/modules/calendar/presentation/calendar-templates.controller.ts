import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ApplyCalendarTemplateService } from '../application/templates/apply-calendar-template.service.js';
import { BulkApplyCalendarTemplateService } from '../application/templates/bulk-apply-calendar-template.service.js';
import { CreateCalendarTemplateService } from '../application/templates/create-calendar-template.service.js';
import { DeleteCalendarTemplateService } from '../application/templates/delete-calendar-template.service.js';
import { ListCalendarTemplatesService } from '../application/templates/list-calendar-templates.service.js';
import { RevertCalendarTemplateBatchService } from '../application/templates/revert-calendar-template-batch.service.js';
import { UpdateCalendarTemplateService } from '../application/templates/update-calendar-template.service.js';
import {
  ApplyCalendarTemplateDto,
  BulkApplyCalendarTemplateDto,
  CalendarTemplateDto,
} from './dto/calendar-template.dto.js';

@Controller('calendar/templates')
export class CalendarTemplatesController {
  public constructor(
    private readonly listTemplates: ListCalendarTemplatesService,
    private readonly createTemplate: CreateCalendarTemplateService,
    private readonly updateTemplate: UpdateCalendarTemplateService,
    private readonly deleteTemplate: DeleteCalendarTemplateService,
    private readonly applyTemplate: ApplyCalendarTemplateService,
    private readonly bulkApplyTemplate: BulkApplyCalendarTemplateService,
    private readonly revertBatch: RevertCalendarTemplateBatchService,
  ) {}
  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.listTemplates.execute(principal.userId);
  }
  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CalendarTemplateDto,
  ) {
    return this.createTemplate.execute(principal.userId, input);
  }
  @Put(':templateId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: CalendarTemplateDto,
  ) {
    return this.updateTemplate.execute(principal.userId, templateId, input);
  }
  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
  ) {
    await this.deleteTemplate.execute(principal.userId, templateId);
  }
  @Post(':templateId/apply')
  public apply(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: ApplyCalendarTemplateDto,
  ) {
    return this.applyTemplate.execute(principal.userId, templateId, input);
  }
  @Post(':templateId/bulk-apply')
  public bulkApply(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: BulkApplyCalendarTemplateDto,
  ) {
    return this.bulkApplyTemplate.execute(principal.userId, templateId, input);
  }
  @Post('batches/:batchId/revert')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revert(
    @CurrentUser() principal: SessionPrincipal,
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
  ) {
    await this.revertBatch.execute(principal.userId, batchId);
  }
}
