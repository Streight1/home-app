import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  CalendarDashboard,
  CalendarEvent,
  CalendarEventInput,
  CalendarFeedItem,
  CalendarTemplate,
  CalendarTemplateInput,
  TravelPlan,
  TravelPlanInput,
  TravelEstimatePreview,
} from '../types/calendar.types.js';

export function previewTravelEstimate(
  input: {
    eventId?: string;
    startsAt: string;
    participantIds: string[];
    destinationPlaceId: string;
    originMode: TravelPlanInput['originMode'];
    originPlaceId?: string | null;
    previousEventId?: string | null;
    routeMode: TravelPlanInput['routeMode'];
    avoidTolls: boolean;
    avoidHighways: boolean;
    travelBufferMinutes: number;
  },
  signal?: AbortSignal,
) {
  return apiRequest<TravelEstimatePreview>('/calendar/travel-estimate', {
    method: 'POST',
    body: JSON.stringify(input),
    ...(signal ? { signal } : {}),
  });
}

export function getCalendarFeed(from: string, to: string) {
  const query = new URLSearchParams({ from, to });
  return apiRequest<{ items: CalendarFeedItem[] }>(`/calendar/feed?${query}`);
}
export function getEventTravelPlans(eventId: string) {
  return apiRequest<{ items: TravelPlan[] }>(
    `/calendar/events/${eventId}/travel-plans`,
  );
}
export function configureEventTravelPlan(
  eventId: string,
  travelerUserId: string,
  input: TravelPlanInput,
) {
  return apiRequest<TravelPlan>(
    `/calendar/events/${eventId}/travel-plans/${travelerUserId}`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}
export function recalculateEventTravelPlan(
  eventId: string,
  travelerUserId: string,
) {
  return apiRequest<TravelPlan>(
    `/calendar/events/${eventId}/travel-plans/${travelerUserId}/recalculate`,
    { method: 'POST' },
  );
}
export function getPreviousEventCandidates(
  eventId: string,
  travelerUserId: string,
) {
  const query = new URLSearchParams({ travelerUserId });
  return apiRequest<{
    items: {
      id: string;
      title: string;
      endsAt: string;
      locationLabel: string | null;
    }[];
  }>(`/calendar/events/${eventId}/travel-origin-candidates?${query}`);
}
export function getCalendarEvent(eventId: string) {
  return apiRequest<CalendarEvent>(`/calendar/events/${eventId}`);
}
export function createCalendarEvent(input: CalendarEventInput) {
  return apiRequest<CalendarEvent>('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export function updateCalendarEvent(
  eventId: string,
  input: Partial<CalendarEventInput>,
) {
  return apiRequest<CalendarEvent>(`/calendar/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
export function cancelCalendarEvent(eventId: string) {
  return apiRequest<CalendarEvent>(`/calendar/events/${eventId}/cancel`, {
    method: 'POST',
  });
}
export function deleteCalendarEvent(eventId: string) {
  return apiRequest<undefined>(`/calendar/events/${eventId}`, {
    method: 'DELETE',
  });
}
export function getCalendarTemplates() {
  return apiRequest<{ items: CalendarTemplate[] }>('/calendar/templates');
}
export function createCalendarTemplate(input: CalendarTemplateInput) {
  return apiRequest<CalendarTemplate>('/calendar/templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export function updateCalendarTemplate(
  templateId: string,
  input: CalendarTemplateInput,
) {
  return apiRequest<CalendarTemplate>(`/calendar/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
export function deleteCalendarTemplate(templateId: string) {
  return apiRequest<undefined>(`/calendar/templates/${templateId}`, {
    method: 'DELETE',
  });
}
export function applyCalendarTemplate(
  templateId: string,
  date: string,
  allowShiftConflicts = false,
) {
  return apiRequest<{
    batchId: string;
    events: CalendarEvent[];
    conflicts: number;
  }>(`/calendar/templates/${templateId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ date, allowShiftConflicts }),
  });
}
export function bulkApplyCalendarTemplate(
  templateId: string,
  dates: string[],
  allowShiftConflicts = false,
) {
  return apiRequest<{
    batchId: string;
    eventCount: number;
    events: CalendarEvent[];
    conflicts: number;
  }>(`/calendar/templates/${templateId}/bulk-apply`, {
    method: 'POST',
    body: JSON.stringify({ dates, allowShiftConflicts }),
  });
}
export function revertCalendarBatch(batchId: string) {
  return apiRequest<undefined>(
    `/calendar/templates/batches/${batchId}/revert`,
    {
      method: 'POST',
    },
  );
}
export function getCalendarDashboard(timezone: string) {
  return apiRequest<CalendarDashboard>(
    `/calendar/dashboard?timezone=${encodeURIComponent(timezone)}`,
  );
}
