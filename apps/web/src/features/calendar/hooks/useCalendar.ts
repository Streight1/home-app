import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TASKS_QUERY_KEY } from '../../tasks/tasks-query.public.js';
import { CALENDAR_QUERY_KEY } from '../calendar-query.public.js';
import {
  applyCalendarTemplate,
  bulkApplyCalendarTemplate,
  cancelCalendarEvent,
  createCalendarEvent,
  createCalendarTemplate,
  deleteCalendarEvent,
  deleteCalendarTemplate,
  getCalendarDashboard,
  getCalendarEvent,
  getCalendarFeed,
  getCalendarTemplates,
  revertCalendarBatch,
  updateCalendarEvent,
  updateCalendarTemplate,
  getEventTravelPlans,
  configureEventTravelPlan,
  recalculateEventTravelPlan,
  getPreviousEventCandidates,
  previewTravelEstimate,
  previewBulkCalendarEvents,
  updateBulkCalendarEvents,
  deleteBulkCalendarEvents,
} from '../api/calendarApi.js';
import type {
  CalendarDashboard,
  CalendarEventInput,
  CalendarTemplateInput,
  CalendarBulkUpdateInput,
  TravelPlanInput,
} from '../types/calendar.types.js';

const timezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Prague';

export function useCalendarFeed(from: string, to: string) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'feed', from, to],
    queryFn: () => getCalendarFeed(from, to),
  });
}
export function useCalendarEvent(eventId: string | null) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'event', eventId],
    queryFn: () => getCalendarEvent(eventId ?? ''),
    enabled: Boolean(eventId),
  });
}
export function useEventTravelPlans(eventId: string | null) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'travel-plans', eventId],
    queryFn: () => getEventTravelPlans(eventId ?? ''),
    enabled: Boolean(eventId),
  });
}
export function usePreviousEventCandidates(
  eventId: string | null,
  travelerUserId: string | null,
) {
  return useQuery({
    queryKey: [
      ...CALENDAR_QUERY_KEY,
      'previous-events',
      eventId,
      travelerUserId,
    ],
    queryFn: () =>
      getPreviousEventCandidates(eventId ?? '', travelerUserId ?? ''),
    enabled: Boolean(eventId && travelerUserId),
  });
}
export function useTravelEstimatePreview(
  input: Parameters<typeof previewTravelEstimate>[0] | null,
) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'travel-preview', input],
    queryFn: ({ signal }) => {
      if (!input) throw new Error('Travel preview input is required.');
      return previewTravelEstimate(input, signal);
    },
    enabled: input !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
export function useCalendarTemplates() {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'templates'],
    queryFn: getCalendarTemplates,
  });
}
export function useCalendarDashboard(initialData?: CalendarDashboard) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'dashboard', timezone()],
    queryFn: () => getCalendarDashboard(timezone()),
    initialData,
    staleTime: initialData ? Number.POSITIVE_INFINITY : 30_000,
  });
}
export function useCalendarMutations() {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
  const refreshAfterDelete = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
    ]);
  return {
    createEvent: useMutation({
      mutationFn: createCalendarEvent,
      onSuccess: refresh,
    }),
    updateEvent: useMutation({
      mutationFn: ({
        eventId,
        input,
      }: {
        eventId: string;
        input: Partial<CalendarEventInput>;
      }) => updateCalendarEvent(eventId, input),
      onSuccess: refresh,
    }),
    cancelEvent: useMutation({
      mutationFn: cancelCalendarEvent,
      onSuccess: refresh,
    }),
    deleteEvent: useMutation({
      mutationFn: deleteCalendarEvent,
      onSuccess: refreshAfterDelete,
    }),
    previewBulk: useMutation({
      mutationFn: previewBulkCalendarEvents,
    }),
    updateBulk: useMutation({
      mutationFn: (input: CalendarBulkUpdateInput) =>
        updateBulkCalendarEvents(input),
      onSuccess: refresh,
    }),
    deleteBulk: useMutation({
      mutationFn: deleteBulkCalendarEvents,
      onSuccess: refreshAfterDelete,
    }),
    createTemplate: useMutation({
      mutationFn: createCalendarTemplate,
      onSuccess: refresh,
    }),
    updateTemplate: useMutation({
      mutationFn: ({
        templateId,
        input,
      }: {
        templateId: string;
        input: CalendarTemplateInput;
      }) => updateCalendarTemplate(templateId, input),
      onSuccess: refresh,
    }),
    deleteTemplate: useMutation({
      mutationFn: deleteCalendarTemplate,
      onSuccess: refresh,
    }),
    applyTemplate: useMutation({
      mutationFn: ({
        templateId,
        date,
        allowShiftConflicts,
      }: {
        templateId: string;
        date: string;
        allowShiftConflicts?: boolean;
      }) => applyCalendarTemplate(templateId, date, allowShiftConflicts),
      onSuccess: refresh,
    }),
    bulkApplyTemplate: useMutation({
      mutationFn: ({
        templateId,
        dates,
        allowShiftConflicts,
      }: {
        templateId: string;
        dates: string[];
        allowShiftConflicts?: boolean;
      }) => bulkApplyCalendarTemplate(templateId, dates, allowShiftConflicts),
      onSuccess: refresh,
    }),
    revertBatch: useMutation({
      mutationFn: revertCalendarBatch,
      onSuccess: refresh,
    }),
    configureTravel: useMutation({
      mutationFn: ({
        eventId,
        travelerUserId,
        input,
      }: {
        eventId: string;
        travelerUserId: string;
        input: TravelPlanInput;
      }) => configureEventTravelPlan(eventId, travelerUserId, input),
      onSuccess: refresh,
    }),
    recalculateTravel: useMutation({
      mutationFn: ({
        eventId,
        travelerUserId,
      }: {
        eventId: string;
        travelerUserId: string;
      }) => recalculateEventTravelPlan(eventId, travelerUserId),
      onSuccess: refresh,
    }),
  };
}
