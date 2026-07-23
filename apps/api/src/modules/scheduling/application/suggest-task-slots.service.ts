import { Inject, Injectable } from '@nestjs/common';
import {
  getZonedParts,
  localDateTimeCandidates,
} from '../../../common/time/zoned-date.js';
import { CalendarAvailabilityFacade } from '../../calendar/calendar-availability.facade.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  TASK_CALENDAR_LINK_REPOSITORY,
  type TaskCalendarLinkRepository,
} from '../domain/ports/task-calendar-link.repository.js';
import {
  SCHEDULING_CLOCK_PORT,
  type SchedulingClockPort,
} from '../domain/ports/scheduling-clock.port.js';
import type {
  SchedulingCandidate,
  SchedulingRejectionCode,
} from '../domain/scheduling-candidate.js';
import {
  balanceCandidateIntervals,
  freeIntervals,
  mergeBusyIntervals,
  type TimeInterval,
} from '../domain/scheduling-window.js';
import {
  invalidSchedulingInput,
  taskAlreadyScheduled,
} from '../domain/scheduling.errors.js';
import type { SuggestTaskSlotsDto } from '../presentation/dto/suggest-task-slots.dto.js';
import { SchedulingCandidateEvaluatorService } from './scheduling-candidate-evaluator.service.js';

const localDate = (instant: Date, timezone: string) => {
  const parts = getZonedParts(instant, timezone);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

const ceilToQuarterHour = (instant: Date) => {
  const step = 15 * 60_000;
  return new Date(Math.ceil(instant.getTime() / step) * step);
};

const intervalMinutes = (interval: TimeInterval) =>
  Math.floor((interval.end.getTime() - interval.start.getTime()) / 60_000);

@Injectable()
export class SuggestTaskSlotsService {
  public constructor(
    private readonly tasks: TasksFacade,
    private readonly calendar: CalendarAvailabilityFacade,
    private readonly evaluator: SchedulingCandidateEvaluatorService,
    @Inject(TASK_CALENDAR_LINK_REPOSITORY)
    private readonly links: TaskCalendarLinkRepository,
    @Inject(SCHEDULING_CLOCK_PORT)
    private readonly clock: SchedulingClockPort,
  ) {}

  public async execute(
    userId: string,
    taskId: string,
    input: SuggestTaskSlotsDto,
  ) {
    const task = await this.tasks.getSchedulingSummary(userId, taskId);
    if (await this.links.findActive(task.householdId, task.id))
      throw taskAlreadyScheduled();
    const requestedStart = localDateTimeCandidates(
      input.date,
      input.earliestTime,
      input.timezone,
    )[0];
    const requestedEnd = localDateTimeCandidates(
      input.date,
      input.latestTime,
      input.timezone,
    )[0];
    if (!requestedStart || !requestedEnd || requestedStart >= requestedEnd)
      throw invalidSchedulingInput('Zvolte platné časové okno v jednom dni.');

    const now = this.clock.now();
    const rejections = new Map<SchedulingRejectionCode, number>();
    let start = requestedStart;
    if (input.date === localDate(now, input.timezone) && now > requestedStart) {
      start = ceilToQuarterHour(now);
      this.record(rejections, 'SEARCH_WINDOW_IN_PAST');
    }
    if (start > requestedEnd) start = requestedEnd;

    const participantIds = task.participants.map(({ userId }) => userId);
    const availability = await this.calendar.loadParticipantAvailability({
      userId,
      householdId: task.householdId,
      participantIds,
      from: start,
      to: requestedEnd,
    });
    const busy = availability.participants.flatMap((participant) =>
      participant.events.map((event) => ({
        start: event.startsAt,
        end: event.endsAt,
      })),
    );
    const window = { start, end: requestedEnd };
    const free =
      start < requestedEnd
        ? freeIntervals(mergeBusyIntervals(busy, window), window)
        : [];
    if (free.length === 0) this.record(rejections, 'NO_COMMON_FREE_INTERVAL');

    const preliminary = balanceCandidateIntervals(
      free,
      task.estimatedDurationMinutes,
      15,
    );
    if (free.length > 0 && preliminary.length === 0)
      this.record(rejections, 'INTERVAL_SHORTER_THAN_TASK', free.length);

    const evaluated: SchedulingCandidate[] = [];
    const requestMemo = new Map<string, Promise<{ durationSeconds: number }>>();
    const evaluationLimit = input.considerTravel
      ? Math.min(preliminary.length, Math.max(input.suggestionCount * 2, 6))
      : preliminary.length;
    for (const candidate of preliminary.slice(0, evaluationLimit)) {
      const result = await this.evaluator.evaluate({
        userId,
        task,
        availability,
        candidate,
        windowStart: start,
        windowEnd: requestedEnd,
        timezone: input.timezone,
        routeMode: input.routeMode,
        bufferMinutes: input.travelBufferMinutes,
        considerTravel: input.considerTravel,
        tokenExpiresAt: new Date(now.getTime() + 15 * 60_000),
        requestMemo,
      });
      if (result.candidate) evaluated.push(result.candidate);
      else this.record(rejections, result.rejection);
    }

    const statusOrder = {
      FEASIBLE: 0,
      FEASIBLE_WITH_WARNINGS: 1,
      TRAVEL_NOT_VERIFIED: 2,
    } as const;
    return {
      task: {
        id: task.id,
        title: task.title,
        durationMinutes: task.estimatedDurationMinutes,
        participants: task.participants,
      },
      candidates: evaluated
        .sort(
          (left, right) =>
            statusOrder[left.status] - statusOrder[right.status] ||
            left.totalTravelMinutes - right.totalTravelMinutes ||
            left.startAt.localeCompare(right.startAt),
        )
        .slice(0, input.suggestionCount),
      diagnostics: {
        summary: {
          freeIntervalsFound: free.length,
          timeCandidatesGenerated: preliminary.length,
          travelCandidatesEvaluated: evaluationLimit,
          feasibleCandidates: evaluated.length,
        },
        rejections: [...rejections.entries()].map(([code, count]) => ({
          code,
          count,
        })),
        freeIntervals: free.map((interval) => ({
          startAt: interval.start.toISOString(),
          endAt: interval.end.toISOString(),
          durationMinutes: intervalMinutes(interval),
        })),
        longestFreeIntervalMinutes: Math.max(0, ...free.map(intervalMinutes)),
        effectiveWindow: {
          startAt: start.toISOString(),
          endAt: requestedEnd.toISOString(),
        },
      },
    };
  }

  private record(
    rejections: Map<SchedulingRejectionCode, number>,
    code: SchedulingRejectionCode,
    count = 1,
  ) {
    rejections.set(code, (rejections.get(code) ?? 0) + count);
  }
}
