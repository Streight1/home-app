import type {
  CalendarEventTravelPlanRecord,
  TransientTravelEstimate,
} from '../../domain/travel/travel-plan.types.js';

export const mapTravelPlanResponse = (
  plan: CalendarEventTravelPlanRecord,
  previousEvent: { endsAt: Date | null } | null,
  estimate: TransientTravelEstimate | null = null,
) => {
  const requiredSeconds = estimate
    ? estimate.durationSeconds + plan.travelBufferMinutes * 60
    : plan.travelBufferMinutes * 60;
  const availableSeconds =
    previousEvent?.endsAt && estimate
      ? Math.max(
          0,
          Math.floor(
            (estimate.departureAt.getTime() +
              requiredSeconds * 1000 -
              previousEvent.endsAt.getTime()) /
              1000,
          ),
        )
      : null;
  const missingSeconds =
    availableSeconds === null
      ? 0
      : Math.max(0, requiredSeconds - availableSeconds);
  return {
    id: plan.id,
    eventId: plan.eventId,
    travelerUserId: plan.travelerUserId,
    originMode: plan.originMode,
    originPlaceId: plan.originPlaceId,
    previousEventId: plan.previousEventId,
    routeMode: plan.routeMode,
    avoidTolls: plan.avoidTolls,
    avoidHighways: plan.avoidHighways,
    travelBufferMinutes: plan.travelBufferMinutes,
    distanceMeters: estimate?.distanceMeters ?? null,
    durationSeconds: estimate?.durationSeconds ?? null,
    departureAt: estimate?.departureAt.toISOString() ?? null,
    status: estimate ? 'READY' : plan.status,
    origin: estimate
      ? {
          source: estimate.originSource,
          eventTitle: estimate.originEventTitle,
        }
      : null,
    conflict: {
      hasConflict: missingSeconds > 0,
      availableTransferSeconds: availableSeconds,
      requiredTransferSeconds: requiredSeconds,
      missingSeconds,
    },
  };
};
