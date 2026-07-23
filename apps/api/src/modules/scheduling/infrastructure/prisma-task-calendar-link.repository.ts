import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { TaskCalendarLinkRepository } from '../domain/ports/task-calendar-link.repository.js';

@Injectable()
export class PrismaTaskCalendarLinkRepository implements TaskCalendarLinkRepository {
  public constructor(private readonly prisma: PrismaService) {}
  public findActive(householdId: string, taskId: string) {
    return this.prisma.taskCalendarLink.findFirst({
      where: { householdId, taskId, removedAt: null },
      select: {
        id: true,
        householdId: true,
        taskId: true,
        calendarEventId: true,
        createdAt: true,
      },
    });
  }
}
