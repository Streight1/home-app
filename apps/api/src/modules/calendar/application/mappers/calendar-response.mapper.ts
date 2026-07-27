import { Injectable } from '@nestjs/common';
import type {
  CalendarEventRecord,
  CalendarTemplateRecord,
} from '../../domain/calendar.types.js';
import { CalendarEventVisualService } from './calendar-event-visual.service.js';

@Injectable()
export class CalendarResponseMapper {
  public constructor(
    private readonly visualService: CalendarEventVisualService = new CalendarEventVisualService(),
  ) {}

  public event(event: CalendarEventRecord) {
    const visual = this.visualService.resolve(event);
    const spansMidnight = event.isAllDay
      ? Boolean(
          event.allDayStartDate &&
          event.allDayEndDateExclusive &&
          new Date(event.allDayEndDateExclusive).getTime() -
            new Date(event.allDayStartDate).getTime() >
            24 * 60 * 60_000,
        )
      : event.startsAt?.toISOString().slice(0, 10) !==
        event.endsAt?.toISOString().slice(0, 10);

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      status: event.status,
      startsAt: event.startsAt?.toISOString() ?? null,
      endsAt: event.endsAt?.toISOString() ?? null,
      allDayStartDate: event.allDayStartDate,
      allDayEndDateExclusive: event.allDayEndDateExclusive,
      desiredArrivalAt: event.desiredArrivalAt?.toISOString() ?? null,
      timezone: event.timezone,
      isAllDay: event.isAllDay,
      location: event.location,
      locationPlaceId: event.locationPlaceId,
      locationLabel: event.locationLabel,
      locationNotes: event.locationNotes,
      calculateTravel: event.calculateTravel,
      colorToken: event.colorToken,
      source: event.source,
      templateId: event.templateId,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      participants: event.participants,
      taskLink: event.taskLink,
      visual,
      spansMidnight,
      permissions: { canEdit: true, canCancel: true, canDelete: true },
    };
  }

  public template(template: CalendarTemplateRecord) {
    return {
      id: template.id,
      name: template.name,
      title: template.title,
      description: template.description,
      eventType: template.eventType,
      startLocalTime: template.startLocalTime,
      endLocalTime: template.endLocalTime,
      endDayOffset: template.endDayOffset,
      timezone: template.timezone,
      isAllDay: template.isAllDay,
      defaultLocation: template.defaultLocation,
      locationPlaceId: template.locationPlaceId,
      locationLabel: template.locationLabel,
      calculateTravel: template.calculateTravel,
      routeMode: template.routeMode,
      travelBufferMinutes: template.travelBufferMinutes,
      colorToken: template.colorToken,
      participantIds: template.participants.map(({ userId }) => userId),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}
