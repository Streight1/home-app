import { Injectable } from '@nestjs/common';
import { getZonedParts } from '../../../../common/time/zoned-date.js';
import type {
  CalendarEventRecord,
  CalendarTemplateRecord,
} from '../../domain/calendar.types.js';

@Injectable()
export class CalendarResponseMapper {
  public event(event: CalendarEventRecord) {
    const start = getZonedParts(event.startsAt, event.timezone);
    const end = getZonedParts(event.endsAt, event.timezone);
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
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
      visual:
        event.participants.length > 1
          ? { colorToken: 'shared', isShared: true }
          : {
              colorToken:
                event.participants[0]?.user.calendarColorToken ?? 'neutral',
              isShared: false,
            },
      spansMidnight:
        start.year !== end.year ||
        start.month !== end.month ||
        start.day !== end.day,
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
