import { Module } from '@nestjs/common';
import { APPLICATION_SEARCH_PROVIDER_TOKENS } from '../../common/search/application-search-provider.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { LocationModule } from '../location/location.module.js';
import { CancelCalendarEventService } from './application/events/cancel-calendar-event.service.js';
import { CalendarEventValidationService } from './application/events/calendar-event-validation.service.js';
import { CreateCalendarEventService } from './application/events/create-calendar-event.service.js';
import { DeleteCalendarEventService } from './application/events/delete-calendar-event.service.js';
import { GetCalendarEventService } from './application/events/get-calendar-event.service.js';
import { ListCalendarEventsService } from './application/events/list-calendar-events.service.js';
import { UpdateCalendarEventService } from './application/events/update-calendar-event.service.js';
import { EventLocationValidationService } from './application/events/event-location-validation.service.js';
import { CalendarTravelPlanService } from './application/travel/calendar-travel-plan.service.js';
import { ResolveTravelOriginService } from './application/travel/resolve-travel-origin.service.js';
import { ListPreviousEventsService } from './application/travel/list-previous-events.service.js';
import { PreviewTravelEstimateService } from './application/travel/preview-travel-estimate.service.js';
import { CALENDAR_TRAVEL_PLAN_REPOSITORY } from './domain/travel/calendar-event-travel-plan.repository.js';
import { GetCalendarFeedService } from './application/feed/get-calendar-feed.service.js';
import { GetTodayCalendarSummaryService } from './application/feed/get-today-calendar-summary.service.js';
import { CalendarResponseMapper } from './application/mappers/calendar-response.mapper.js';
import { CalendarEventVisualService } from './application/mappers/calendar-event-visual.service.js';
import { ApplyCalendarTemplateService } from './application/templates/apply-calendar-template.service.js';
import { BulkApplyCalendarTemplateService } from './application/templates/bulk-apply-calendar-template.service.js';
import { CalendarTemplateValidationService } from './application/templates/calendar-template-validation.service.js';
import { CreateCalendarTemplateService } from './application/templates/create-calendar-template.service.js';
import { DeleteCalendarTemplateService } from './application/templates/delete-calendar-template.service.js';
import { ListCalendarTemplatesService } from './application/templates/list-calendar-templates.service.js';
import { RevertCalendarTemplateBatchService } from './application/templates/revert-calendar-template-batch.service.js';
import { UpdateCalendarTemplateService } from './application/templates/update-calendar-template.service.js';
import { CALENDAR_EVENT_REPOSITORY } from './domain/ports/calendar-event.repository.js';
import { CALENDAR_TEMPLATE_REPOSITORY } from './domain/ports/calendar-template.repository.js';
import { CALENDAR_CLOCK_PORT } from './domain/ports/clock.port.js';
import { TaskCalendarSource } from './infrastructure/feed-sources/task-calendar.source.js';
import { ManualCalendarEventSource } from './infrastructure/feed-sources/manual-calendar-event.source.js';
import { PrismaCalendarEventRepository } from './infrastructure/prisma-calendar-event.repository.js';
import { PrismaCalendarTemplateRepository } from './infrastructure/prisma-calendar-template.repository.js';
import { PrismaCalendarEventTravelPlanRepository } from './infrastructure/prisma-calendar-event-travel-plan.repository.js';
import { SystemCalendarClockAdapter } from './infrastructure/system-calendar-clock.adapter.js';
import { CalendarEventsController } from './presentation/calendar-events.controller.js';
import { CalendarFeedController } from './presentation/calendar-feed.controller.js';
import { CalendarTemplatesController } from './presentation/calendar-templates.controller.js';
import { CalendarTravelController } from './presentation/calendar-travel.controller.js';
import { CalendarTravelEstimateController } from './presentation/calendar-travel-estimate.controller.js';
import { CalendarAvailabilityFacade } from './calendar-availability.facade.js';
import { CalendarEventCreationFacade } from './calendar-event-creation.facade.js';
import { PreviewBulkCalendarEventsService } from './application/events/preview-bulk-calendar-events.service.js';
import { BulkUpdateCalendarEventsService } from './application/events/bulk-update-calendar-events.service.js';
import { BulkDeleteCalendarEventsService } from './application/events/bulk-delete-calendar-events.service.js';
import { CalendarSearchProvider } from './search/calendar-search.provider.js';

@Module({
  imports: [TasksModule, AuditModule, HouseholdsModule, LocationModule],
  controllers: [
    CalendarEventsController,
    CalendarTemplatesController,
    CalendarFeedController,
    CalendarTravelController,
    CalendarTravelEstimateController,
  ],
  providers: [
    PrismaCalendarEventRepository,
    {
      provide: CALENDAR_EVENT_REPOSITORY,
      useExisting: PrismaCalendarEventRepository,
    },
    PrismaCalendarTemplateRepository,
    PrismaCalendarEventTravelPlanRepository,
    {
      provide: CALENDAR_TRAVEL_PLAN_REPOSITORY,
      useExisting: PrismaCalendarEventTravelPlanRepository,
    },
    {
      provide: CALENDAR_TEMPLATE_REPOSITORY,
      useExisting: PrismaCalendarTemplateRepository,
    },
    SystemCalendarClockAdapter,
    { provide: CALENDAR_CLOCK_PORT, useExisting: SystemCalendarClockAdapter },
    CalendarResponseMapper,
    CalendarEventVisualService,
    CalendarEventValidationService,
    EventLocationValidationService,
    ResolveTravelOriginService,
    CalendarTravelPlanService,
    ListPreviousEventsService,
    PreviewTravelEstimateService,
    CreateCalendarEventService,
    UpdateCalendarEventService,
    GetCalendarEventService,
    ListCalendarEventsService,
    CancelCalendarEventService,
    DeleteCalendarEventService,
    PreviewBulkCalendarEventsService,
    BulkUpdateCalendarEventsService,
    BulkDeleteCalendarEventsService,
    CalendarSearchProvider,
    {
      provide: APPLICATION_SEARCH_PROVIDER_TOKENS.calendar,
      useExisting: CalendarSearchProvider,
    },
    CalendarTemplateValidationService,
    ListCalendarTemplatesService,
    CreateCalendarTemplateService,
    UpdateCalendarTemplateService,
    DeleteCalendarTemplateService,
    ApplyCalendarTemplateService,
    BulkApplyCalendarTemplateService,
    RevertCalendarTemplateBatchService,
    ManualCalendarEventSource,
    TaskCalendarSource,
    GetCalendarFeedService,
    GetTodayCalendarSummaryService,
    CalendarAvailabilityFacade,
    CalendarEventCreationFacade,
  ],
  exports: [
    CalendarAvailabilityFacade,
    CalendarEventCreationFacade,
    APPLICATION_SEARCH_PROVIDER_TOKENS.calendar,
  ],
})
export class CalendarModule {}
