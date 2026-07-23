import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module.js';
import { LocationModule } from '../location/location.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { CandidateTokenService } from './application/candidate-token.service.js';
import { ConfirmTaskSlotService } from './application/confirm-task-slot.service.js';
import { SchedulingCandidateEvaluatorService } from './application/scheduling-candidate-evaluator.service.js';
import { SuggestTaskSlotsService } from './application/suggest-task-slots.service.js';
import { UnscheduleTaskService } from './application/unschedule-task.service.js';
import { TASK_CALENDAR_LINK_REPOSITORY } from './domain/ports/task-calendar-link.repository.js';
import { SCHEDULING_CLOCK_PORT } from './domain/ports/scheduling-clock.port.js';
import { PrismaTaskCalendarLinkRepository } from './infrastructure/prisma-task-calendar-link.repository.js';
import { SystemSchedulingClockAdapter } from './infrastructure/system-scheduling-clock.adapter.js';
import { TaskSchedulingController } from './presentation/task-scheduling.controller.js';

@Module({
  imports: [TasksModule, CalendarModule, LocationModule],
  controllers: [TaskSchedulingController],
  providers: [
    PrismaTaskCalendarLinkRepository,
    {
      provide: TASK_CALENDAR_LINK_REPOSITORY,
      useExisting: PrismaTaskCalendarLinkRepository,
    },
    CandidateTokenService,
    SchedulingCandidateEvaluatorService,
    SystemSchedulingClockAdapter,
    {
      provide: SCHEDULING_CLOCK_PORT,
      useExisting: SystemSchedulingClockAdapter,
    },
    SuggestTaskSlotsService,
    ConfirmTaskSlotService,
    UnscheduleTaskService,
  ],
})
export class SchedulingModule {}
