export type SchedulingWarning =
  | 'TRAVEL_ORIGIN_UNKNOWN'
  | 'NEXT_EVENT_LOCATION_UNKNOWN'
  | 'TASK_LOCATION_NOT_ROUTABLE'
  | 'ROUTING_UNAVAILABLE'
  | 'TRAVEL_NOT_CONSIDERED';

export type SchedulingRejectionCode =
  | 'TASK_DURATION_MISSING'
  | 'TASK_PARTICIPANTS_MISSING'
  | 'NO_COMMON_FREE_INTERVAL'
  | 'INTERVAL_SHORTER_THAN_TASK'
  | 'TRAVEL_ORIGIN_UNKNOWN'
  | 'TASK_LOCATION_NOT_ROUTABLE'
  | 'ROUTING_UNAVAILABLE'
  | 'NOT_ENOUGH_TIME_AFTER_PREVIOUS_EVENT'
  | 'NOT_ENOUGH_TIME_BEFORE_NEXT_EVENT'
  | 'SEARCH_WINDOW_IN_PAST'
  | 'SLOT_CHANGED';

export interface SchedulingCandidate {
  startAt: string;
  endAt: string;
  status: 'FEASIBLE' | 'FEASIBLE_WITH_WARNINGS' | 'TRAVEL_NOT_VERIFIED';
  participantTravel: {
    userId: string;
    displayName: string | null;
    travelBeforeMinutes: number | null;
    departureAt: string | null;
    travelAfterMinutes: number | null;
    warnings: SchedulingWarning[];
  }[];
  totalTravelMinutes: number;
  warnings: SchedulingWarning[];
  candidateToken: string;
}

export interface SchedulingSuggestions {
  task: {
    id: string;
    title: string;
    durationMinutes: number;
    participants: {
      userId: string;
      displayName: string | null;
      avatarUrl: string | null;
    }[];
  };
  candidates: SchedulingCandidate[];
  diagnostics: {
    summary: {
      freeIntervalsFound: number;
      timeCandidatesGenerated: number;
      travelCandidatesEvaluated: number;
      feasibleCandidates: number;
    };
    rejections: { code: SchedulingRejectionCode; count: number }[];
    freeIntervals: {
      startAt: string;
      endAt: string;
      durationMinutes: number;
    }[];
    longestFreeIntervalMinutes: number;
    effectiveWindow: { startAt: string; endAt: string };
  };
}

export interface SchedulingInput {
  date: string;
  earliestTime: string;
  latestTime: string;
  timezone: string;
  routeMode: 'CAR_FAST_TRAFFIC' | 'CAR_FAST' | 'CAR_SHORT' | 'FOOT_FAST';
  travelBufferMinutes: number;
  considerTravel: boolean;
  suggestionCount: number;
}
