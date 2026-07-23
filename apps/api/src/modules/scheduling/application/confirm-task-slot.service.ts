import { Inject, Injectable } from '@nestjs/common';
import { CalendarAvailabilityFacade } from '../../calendar/calendar-availability.facade.js';
import { CalendarEventCreationFacade } from '../../calendar/calendar-event-creation.facade.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  TASK_CALENDAR_LINK_REPOSITORY,
  type TaskCalendarLinkRepository,
} from '../domain/ports/task-calendar-link.repository.js';
import {
  slotChanged,
  taskAlreadyScheduled,
} from '../domain/scheduling.errors.js';
import { CandidateTokenService } from './candidate-token.service.js';

@Injectable()
export class ConfirmTaskSlotService {
  public constructor(
    private readonly tasks: TasksFacade,
    private readonly availability: CalendarAvailabilityFacade,
    private readonly calendar: CalendarEventCreationFacade,
    private readonly tokens: CandidateTokenService,
    @Inject(TASK_CALENDAR_LINK_REPOSITORY)
    private readonly links: TaskCalendarLinkRepository,
  ) {}

  public async execute(userId: string, taskId: string, candidateToken: string) {
    const token = this.tokens.verify(candidateToken);
    if (token.taskId !== taskId) throw slotChanged();
    const task = await this.tasks.getSchedulingSummary(userId, taskId);
    if (task.version !== token.taskVersion) throw slotChanged();
    if (await this.links.findActive(task.householdId, task.id))
      throw taskAlreadyScheduled();
    const start = new Date(token.startAt);
    const end = new Date(token.endAt);
    const windowStart = new Date(token.windowStart);
    const windowEnd = new Date(token.windowEnd);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      !Number.isFinite(windowStart.getTime()) ||
      !Number.isFinite(windowEnd.getTime()) ||
      start < windowStart ||
      end > windowEnd ||
      start >= end
    )
      throw slotChanged();
    const participantIds = task.participants.map(
      (participant) => participant.userId,
    );
    const availability = await this.availability.loadParticipantAvailability({
      userId,
      householdId: task.householdId,
      participantIds,
      from: windowStart,
      to: windowEnd,
    });
    if (availability.version !== token.calendarVersion) throw slotChanged();
    if (
      availability.participants.some((participant) =>
        participant.events.some(
          (event) => event.startsAt < end && event.endsAt > start,
        ),
      )
    )
      throw slotChanged();
    try {
      return await this.calendar.createTaskLinkedEvent({
        householdId: task.householdId,
        userId,
        taskId: task.id,
        title: task.title,
        startsAt: start,
        endsAt: end,
        timezone: token.timezone,
        participantIds,
        locationPlaceId: task.location?.placeId ?? null,
        locationLabel: task.location?.label ?? null,
        routeMode: token.routeMode,
        travelBufferMinutes: token.travelBufferMinutes,
        considerTravel: token.considerTravel,
      });
    } catch {
      if (await this.links.findActive(task.householdId, task.id))
        throw taskAlreadyScheduled();
      throw slotChanged();
    }
  }
}
