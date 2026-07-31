import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ExpeditionsReportingService } from '../application/expeditions-reporting.service.js';
import { TripPackingService } from '../application/trip-packing.service.js';
import { TripsService } from '../application/trips.service.js';
import {
  AcknowledgeReadinessRuleDto,
  ApplyTripReviewToTemplateDto,
  ApplyTripTemplateDto,
  CompleteTripDto,
  CreateTripDto,
  CreateTripTaskDto,
  ReplaceTripPackItemsDto,
  ReplaceTripParticipantsDto,
  ReviewTripDto,
  UpdatePackingStatusDto,
  UpdateTripDto,
} from './dto/trip.dto.js';

@Controller('trips')
export class TripsController {
  public constructor(
    private readonly trips: TripsService,
    private readonly packing: TripPackingService,
    private readonly reporting: ExpeditionsReportingService,
  ) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.trips.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateTripDto,
  ) {
    return this.trips.create(principal.userId, input);
  }

  @Get('dashboard')
  public dashboard(@CurrentUser() principal: SessionPrincipal) {
    return this.reporting.dashboard(principal.userId);
  }

  @Get(':tripId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.trips.detail(principal.userId, tripId);
  }

  @Patch(':tripId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: UpdateTripDto,
  ) {
    return this.trips.update(principal.userId, tripId, input);
  }

  @Post(':tripId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.trips.setArchived(principal.userId, tripId, true);
  }

  @Post(':tripId/create-from-template')
  public applyTemplate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: ApplyTripTemplateDto,
  ) {
    return this.packing.applyTemplate(
      principal.userId,
      tripId,
      input.templateId,
      input.confirmed,
    );
  }

  @Put(':tripId/participants')
  public participants(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: ReplaceTripParticipantsDto,
  ) {
    return this.trips.replaceParticipants(
      principal.userId,
      tripId,
      input.participants,
    );
  }

  @Put(':tripId/pack-items')
  public packItems(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: ReplaceTripPackItemsDto,
  ) {
    return this.packing.replaceItems(principal.userId, tripId, input.items);
  }

  @Post(':tripId/packing-status')
  public packingStatus(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: UpdatePackingStatusDto,
  ) {
    return this.packing.updatePackingStatus(
      principal.userId,
      tripId,
      input.itemIds,
      input.status,
    );
  }

  @Post(':tripId/ready')
  public ready(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.reporting.markReady(principal.userId, tripId);
  }

  @Post(':tripId/complete')
  public complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: CompleteTripDto,
  ) {
    return this.reporting.complete(principal.userId, tripId, input.confirmed);
  }

  @Post(':tripId/review')
  public review(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: ReviewTripDto,
  ) {
    return this.packing.review(principal.userId, tripId, input.items);
  }

  @Get(':tripId/template-review-preview')
  public templateReviewPreview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.packing.templateReviewPreview(principal.userId, tripId);
  }

  @Post(':tripId/template-review')
  public applyReviewToTemplate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: ApplyTripReviewToTemplateDto,
  ) {
    return this.packing.applyReviewToTemplate(principal.userId, tripId, input);
  }

  @Get(':tripId/weight-summary')
  public weightSummary(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.reporting.summary(principal.userId, tripId);
  }

  @Post(':tripId/readiness-acknowledgements')
  public acknowledgeRule(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: AcknowledgeReadinessRuleDto,
  ) {
    return this.reporting.acknowledgeRule(
      principal.userId,
      tripId,
      input.ruleCode,
    );
  }

  @Post(':tripId/tasks')
  public createTask(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: CreateTripTaskDto,
  ) {
    return this.packing.createTask(principal.userId, tripId, input);
  }

  @Get(':tripId/catalog-update-preview')
  public catalogPreview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ) {
    return this.packing.catalogUpdatePreview(principal.userId, tripId);
  }

  @Post(':tripId/catalog-update')
  public catalogUpdate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() input: CompleteTripDto,
  ) {
    return this.packing.applyCatalogUpdate(
      principal.userId,
      tripId,
      input.confirmed,
    );
  }
}
