import { Injectable } from '@nestjs/common';
import type { CalendarAvailabilityFacade } from '../../calendar/calendar-availability.facade.js';
import { TravelEstimationFacade } from '../../location/travel-estimation.facade.js';
import type { TasksFacade } from '../../tasks/tasks.facade.js';
import type { SuggestTaskSlotsDto } from '../presentation/dto/suggest-task-slots.dto.js';
import type { TimeInterval } from '../domain/scheduling-window.js';
import type {
  ParticipantTravelCandidate,
  SchedulingCandidate,
  SchedulingRejectionCode,
  SchedulingWarning,
} from '../domain/scheduling-candidate.js';
import { CandidateTokenService } from './candidate-token.service.js';

type SchedulingTask = Awaited<ReturnType<TasksFacade['getSchedulingSummary']>>;
type Availability = Awaited<
  ReturnType<CalendarAvailabilityFacade['loadParticipantAvailability']>
>;

export type CandidateEvaluation =
  | { candidate: SchedulingCandidate; rejection: null }
  | { candidate: null; rejection: SchedulingRejectionCode };

const minutes = (seconds: number) => Math.ceil(seconds / 60);

@Injectable()
export class SchedulingCandidateEvaluatorService {
  public constructor(
    private readonly travel: TravelEstimationFacade,
    private readonly tokens: CandidateTokenService,
  ) {}

  public async evaluate(input: {
    userId: string;
    task: SchedulingTask;
    availability: Availability;
    candidate: TimeInterval;
    windowStart: Date;
    windowEnd: Date;
    timezone: string;
    routeMode: SuggestTaskSlotsDto['routeMode'];
    bufferMinutes: number;
    considerTravel: boolean;
    tokenExpiresAt: Date;
    requestMemo: Map<string, Promise<{ durationSeconds: number }>>;
  }): Promise<CandidateEvaluation> {
    const warnings = new Set<SchedulingWarning>();
    const participantTravel: ParticipantTravelCandidate[] = [];
    let totalTravelMinutes = 0;
    let travelNotVerified = !input.considerTravel;
    if (!input.considerTravel) warnings.add('TRAVEL_NOT_CONSIDERED');

    for (const person of input.task.participants) {
      const availability = input.availability.participants.find(
        (participant) => participant.userId === person.userId,
      );
      if (!availability)
        return { candidate: null, rejection: 'NO_COMMON_FREE_INTERVAL' };
      const previous = [...availability.events]
        .filter((event) => event.endsAt <= input.candidate.start)
        .sort(
          (left, right) => right.endsAt.getTime() - left.endsAt.getTime(),
        )[0];
      const next = [...availability.events]
        .filter((event) => event.startsAt >= input.candidate.end)
        .sort(
          (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
        )[0];
      const personWarnings = new Set<SchedulingWarning>();
      let before: number | null = null;
      let after: number | null = null;

      if (!input.considerTravel) {
        personWarnings.add('TRAVEL_NOT_CONSIDERED');
      } else if (
        !input.task.location?.routable ||
        !input.task.location.placeId
      ) {
        personWarnings.add('TASK_LOCATION_NOT_ROUTABLE');
        travelNotVerified = true;
      } else {
        const originId =
          previous?.locationPlaceId ?? availability.defaultPlaceId;
        if (!originId) {
          personWarnings.add('TRAVEL_ORIGIN_UNKNOWN');
          travelNotVerified = true;
        } else {
          try {
            before = await this.routeMinutes(
              input,
              originId,
              input.task.location.placeId,
            );
          } catch {
            personWarnings.add('ROUTING_UNAVAILABLE');
            travelNotVerified = true;
          }
        }
        if (next && !next.locationPlaceId) {
          personWarnings.add('NEXT_EVENT_LOCATION_UNKNOWN');
          travelNotVerified = true;
        } else if (next?.locationPlaceId) {
          try {
            after = await this.routeMinutes(
              input,
              input.task.location.placeId,
              next.locationPlaceId,
            );
          } catch {
            personWarnings.add('ROUTING_UNAVAILABLE');
            travelNotVerified = true;
          }
        }
      }

      const bufferMs = input.bufferMinutes * 60_000;
      const departureAt =
        before === null
          ? null
          : new Date(
              input.candidate.start.getTime() - before * 60_000 - bufferMs,
            );
      if (
        input.considerTravel &&
        before !== null &&
        departureAt &&
        departureAt < (previous?.endsAt ?? input.windowStart)
      )
        return {
          candidate: null,
          rejection: 'NOT_ENOUGH_TIME_AFTER_PREVIOUS_EVENT',
        };
      if (
        input.considerTravel &&
        next &&
        after !== null &&
        input.candidate.end.getTime() + after * 60_000 + bufferMs >
          next.startsAt.getTime()
      )
        return {
          candidate: null,
          rejection: 'NOT_ENOUGH_TIME_BEFORE_NEXT_EVENT',
        };

      totalTravelMinutes += (before ?? 0) + (after ?? 0);
      personWarnings.forEach((warning) => warnings.add(warning));
      participantTravel.push({
        userId: person.userId,
        displayName: person.displayName,
        travelBeforeMinutes: before,
        departureAt: departureAt?.toISOString() ?? null,
        travelAfterMinutes: after,
        warnings: [...personWarnings],
      });
    }

    return {
      rejection: null,
      candidate: {
        startAt: input.candidate.start.toISOString(),
        endAt: input.candidate.end.toISOString(),
        status: travelNotVerified
          ? 'TRAVEL_NOT_VERIFIED'
          : warnings.size
            ? 'FEASIBLE_WITH_WARNINGS'
            : 'FEASIBLE',
        participantTravel,
        totalTravelMinutes,
        warnings: [...warnings],
        candidateToken: this.tokens.sign({
          taskId: input.task.id,
          startAt: input.candidate.start.toISOString(),
          endAt: input.candidate.end.toISOString(),
          windowStart: input.windowStart.toISOString(),
          windowEnd: input.windowEnd.toISOString(),
          timezone: input.timezone,
          routeMode: input.routeMode,
          travelBufferMinutes: input.bufferMinutes,
          considerTravel: input.considerTravel,
          expiresAt: input.tokenExpiresAt.toISOString(),
          taskVersion: input.task.version,
          calendarVersion: input.availability.version,
        }),
      },
    };
  }

  private routeMinutes(
    input: Parameters<SchedulingCandidateEvaluatorService['evaluate']>[0],
    originPlaceId: string,
    destinationPlaceId: string,
  ) {
    const key = `${originPlaceId}:${destinationPlaceId}:${input.routeMode}:${input.candidate.start.toISOString()}`;
    let request = input.requestMemo.get(key);
    if (!request) {
      request = this.travel.estimateBetweenPlaces({
        userId: input.userId,
        householdId: input.task.householdId,
        originPlaceId,
        destinationPlaceId,
        routeMode: input.routeMode,
        departureAt: input.candidate.start,
      });
      input.requestMemo.set(key, request);
    }
    return request.then((result) => minutes(result.durationSeconds));
  }
}
