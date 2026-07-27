export type CalendarFeedItem =
  | {
      sourceType: 'CALENDAR_EVENT';
      id: string;
      title: string;
      start: string;
      end: string;
      status: 'ACTIVE' | 'CANCELLED';
      eventType: string;
      colorToken: string;
      visual: {
        colorToken: string;
        backgroundToken: string;
        borderToken: string;
        foregroundToken: string;
        isShared: boolean;
        kind: 'EVENT' | 'WORK_SHIFT' | 'TASK';
      };
      isAllDay: boolean;
      participants: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
        calendarColorToken: string;
      }[];
      locationLabel: string | null;
      taskLink: {
        taskId: string;
        status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
        canComplete: boolean;
      } | null;
      navigationTarget: { area: 'calendar'; screen: 'detail'; eventId: string };
    }
  | {
      sourceType: 'TRAVEL_BLOCK';
      id: string;
      eventId: string;
      travelerUserId: string;
      title: string;
      eventTitle: string;
      start: string;
      end: string;
      eventStartsAt: string;
      status: string;
      routeMode: string;
      durationSeconds: number;
      distanceMeters: number;
      bufferMinutes: number;
      hasConflict: boolean;
      missingSeconds: number;
      traveler: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
      } | null;
      navigationTarget: { area: 'calendar'; screen: 'detail'; eventId: string };
    }
  | {
      sourceType: 'TASK';
      id: string;
      title: string;
      start: string;
      end: null;
      status: string;
      priority: string;
      isAllDay: boolean;
      canComplete: boolean;
      navigationTarget: { area: 'tasks'; screen: 'detail'; taskId: string };
    };

export interface CalendarFeedSourcePort {
  list(input: {
    userId: string;
    householdId: string;
    from: Date;
    to: Date;
    canMutate: boolean;
  }): Promise<CalendarFeedItem[]>;
}
