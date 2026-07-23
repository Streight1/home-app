import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type {
  TaskRepository,
  TaskWriteInput,
  ListTasksInput,
} from '../domain/ports/task.repository.js';
import { zonedDayBounds } from '../domain/zoned-date.js';
import {
  taskPersonSelect,
  taskInclude,
  taskViewWhere,
  toTaskRecord,
} from './prisma-task.mapper.js';
import { PrismaTaskWriter } from './prisma-task.writer.js';
import { dateOnlyDbValue, localIsoDate } from '../domain/task-due-date.js';

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly writer: PrismaTaskWriter,
  ) {}

  public async findById(householdId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, householdId },
      include: taskInclude,
    });
    return task ? toTaskRecord(task) : null;
  }

  public async list(input: ListTasksInput) {
    const where: Prisma.TaskWhereInput = {
      householdId: input.householdId,
      ...taskViewWhere(input),
      ...(input.query
        ? {
            OR: [
              { title: { contains: input.query, mode: 'insensitive' } },
              { description: { contains: input.query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.assignedToUserId
        ? { participants: { some: { userId: input.assignedToUserId } } }
        : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    };
    if (input.useDefaultAllOrder)
      return this.listWithDefaultAllOrder(input, where);
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: { [input.sortBy]: input.sortDirection },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { items: items.map(toTaskRecord), totalItems };
  }

  private async listWithDefaultAllOrder(
    input: ListTasksInput,
    where: Prisma.TaskWhereInput,
  ) {
    const today = localIsoDate(input.now, input.timezone);
    const conditions: Prisma.Sql[] = [
      Prisma.sql`"householdId" = ${input.householdId}::uuid`,
      Prisma.sql`"status" = 'OPEN'::"AgendaTaskStatus"`,
    ];
    if (input.status)
      conditions.push(
        Prisma.sql`"status" = ${input.status}::"AgendaTaskStatus"`,
      );
    if (input.query) {
      const escaped = input.query.replace(/[\\%_]/g, '\\$&');
      const pattern = `%${escaped}%`;
      conditions.push(
        Prisma.sql`("title" ILIKE ${pattern} ESCAPE '\\' OR "description" ILIKE ${pattern} ESCAPE '\\')`,
      );
    }
    if (input.priority)
      conditions.push(
        Prisma.sql`"priority" = ${input.priority}::"AgendaTaskPriority"`,
      );
    if (input.assignedToUserId)
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "TaskParticipant" participant
        WHERE participant."taskId" = "AgendaTask"."id"
          AND participant."userId" = ${input.assignedToUserId}::uuid
      )`);
    if (input.categoryId)
      conditions.push(Prisma.sql`"categoryId" = ${input.categoryId}::uuid`);
    if (input.dueFrom) conditions.push(Prisma.sql`"dueAt" >= ${input.dueFrom}`);
    if (input.dueTo) conditions.push(Prisma.sql`"dueAt" <= ${input.dueTo}`);
    const offset = (input.page - 1) * input.pageSize;
    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id"
        FROM "AgendaTask"
        WHERE ${Prisma.join(conditions, ' AND ')}
        ORDER BY
          CASE
            WHEN ("dueAt" IS NOT NULL AND "dueAt" < ${input.now})
              OR ("dueAt" IS NULL AND "dueDate" < ${today}::date) THEN 0
            WHEN "priority" IN ('URGENT', 'HIGH') THEN 1
            WHEN "dueDate" = ${today}::date THEN 2
            WHEN "dueDate" > ${today}::date THEN 3
            ELSE 4
          END ASC,
          CASE "priority"
            WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1
            WHEN 'NORMAL' THEN 2 ELSE 3
          END ASC,
          "dueDate" ASC NULLS LAST,
          "dueTimeMinutes" ASC NULLS LAST,
          "createdAt" DESC,
          "id" ASC
        OFFSET ${offset} LIMIT ${input.pageSize}
      `),
      this.prisma.task.count({ where }),
    ]);
    if (rows.length === 0) return { items: [], totalItems };
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
      include: taskInclude,
    });
    const byId = new Map(tasks.map((task) => [task.id, task]));
    return {
      items: rows
        .map((row) => byId.get(row.id))
        .filter((task): task is NonNullable<typeof task> => Boolean(task))
        .map(toTaskRecord),
      totalItems,
    };
  }

  public async listMembers(householdId: string) {
    const members = await this.prisma.householdMember.findMany({
      where: { householdId, user: { status: 'ACTIVE' } },
      include: { user: { select: taskPersonSelect } },
      orderBy: { createdAt: 'asc' },
    });
    return members.map(({ role, calendarColorToken, user }) => ({
      ...user,
      role,
      calendarColorToken,
    }));
  }

  public async isActiveMember(householdId: string, userId: string) {
    return Boolean(
      await this.prisma.householdMember.findFirst({
        where: { householdId, userId, user: { status: 'ACTIVE' } },
        select: { id: true },
      }),
    );
  }

  public async create(input: {
    householdId: string;
    userId: string;
    task: TaskWriteInput;
  }) {
    const id = await this.writer.create(input);
    const created = await this.findById(input.householdId, id);
    if (!created) throw new Error('TASK_CREATE_FAILED');
    return created;
  }

  public async update(input: {
    householdId: string;
    userId: string;
    taskId: string;
    task: Partial<TaskWriteInput>;
    changedFields: readonly string[];
  }) {
    const updated = await this.writer.update(input);
    return updated ? this.findById(input.householdId, input.taskId) : null;
  }

  public async complete(input: {
    householdId: string;
    userId: string;
    taskId: string;
    completedAt: Date;
    note: string | null;
    nextDueDate: string | null;
    nextDueTimeMinutes: number | null;
    nextDueAt: Date | null;
    remainsOpen: boolean;
  }) {
    const completed = await this.writer.complete(input);
    return completed ? this.findById(input.householdId, input.taskId) : null;
  }

  public async transition(input: {
    householdId: string;
    userId: string;
    taskId: string;
    fromStatuses: readonly ('OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED')[];
    status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    archivedAt?: Date | null;
    action: 'TASK_REOPENED' | 'TASK_CANCELLED' | 'TASK_ARCHIVED';
  }) {
    const result = await this.writer.transition(input);
    return result ? this.findById(input.householdId, input.taskId) : null;
  }

  public async attention(input: {
    householdId: string;
    now: Date;
    timezone: string;
    limit: number;
  }) {
    const day = zonedDayBounds(input.now, input.timezone);
    const today = dateOnlyDbValue(localIsoDate(input.now, input.timezone));
    const base = { householdId: input.householdId, status: 'OPEN' } as const;
    const [tasks, todayCount, overdueCount] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where: {
          ...base,
          OR: [
            { dueAt: { lte: day.end } },
            { dueAt: null, dueDate: { lte: today } },
            { priority: 'URGENT' },
            { dueAt: { gt: day.end } },
            { dueAt: null, dueDate: { gt: today } },
          ],
        },
        include: taskInclude,
        orderBy: [
          { dueAt: { sort: 'asc', nulls: 'last' } },
          { priority: 'desc' },
        ],
        take: input.limit,
      }),
      this.prisma.task.count({
        where: {
          ...base,
          OR: [
            { dueAt: { gte: day.start, lte: day.end } },
            { dueAt: null, dueDate: today },
          ],
        },
      }),
      this.prisma.task.count({
        where: {
          ...base,
          OR: [
            { dueAt: { lt: input.now } },
            { dueAt: null, dueDate: { lt: today } },
          ],
        },
      }),
    ]);
    return {
      items: tasks.map(toTaskRecord),
      todayCount,
      overdueCount,
    };
  }

  public async dashboard(input: {
    householdId: string;
    now: Date;
    timezone: string;
    limit: number;
  }) {
    const day = zonedDayBounds(input.now, input.timezone);
    const todayIso = localIsoDate(input.now, input.timezone);
    const today = dateOnlyDbValue(todayIso);
    const base = { householdId: input.householdId, status: 'OPEN' } as const;
    const [rows, openTotal, overdueTotal, dueTodayTotal, upcomingTotal] =
      await this.prisma.$transaction([
        this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT "id"
          FROM "AgendaTask"
          WHERE "householdId" = ${input.householdId}::uuid
            AND "status" = 'OPEN'::"AgendaTaskStatus"
          ORDER BY
            CASE
              WHEN ("dueAt" IS NOT NULL AND "dueAt" < ${input.now})
                OR ("dueAt" IS NULL AND "dueDate" < ${todayIso}::date) THEN 0
              WHEN "dueDate" = ${todayIso}::date THEN 1
              WHEN "priority" = 'URGENT' THEN 2
              WHEN "dueDate" > ${todayIso}::date THEN 3
              ELSE 4
            END ASC,
            "dueDate" ASC NULLS LAST,
            "dueTimeMinutes" ASC NULLS LAST,
            "createdAt" DESC,
            "id" ASC
          LIMIT ${input.limit}
        `),
        this.prisma.task.count({ where: base }),
        this.prisma.task.count({
          where: {
            ...base,
            OR: [
              { dueAt: { lt: input.now } },
              { dueAt: null, dueDate: { lt: today } },
            ],
          },
        }),
        this.prisma.task.count({
          where: {
            ...base,
            OR: [
              { dueAt: { gte: day.start, lte: day.end } },
              { dueAt: null, dueDate: today },
            ],
          },
        }),
        this.prisma.task.count({
          where: {
            ...base,
            OR: [
              { dueAt: { gt: day.end } },
              { dueAt: null, dueDate: { gt: today } },
            ],
          },
        }),
      ]);
    const tasks = rows.length
      ? await this.prisma.task.findMany({
          where: { id: { in: rows.map((row) => row.id) } },
          include: taskInclude,
        })
      : [];
    const byId = new Map(tasks.map((task) => [task.id, task]));
    return {
      items: rows
        .map((row) => byId.get(row.id))
        .filter((task) => task !== undefined)
        .map(toTaskRecord),
      openTotal,
      overdueTotal,
      dueTodayTotal,
      upcomingTotal,
    };
  }

  public async calendarFeed(input: {
    householdId: string;
    from: Date;
    to: Date;
  }) {
    const fromDate = new Date(input.from);
    fromDate.setUTCDate(fromDate.getUTCDate() - 1);
    const toDate = new Date(input.to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    const tasks = await this.prisma.task.findMany({
      where: {
        householdId: input.householdId,
        status: 'OPEN',
        OR: [
          { dueAt: { gte: input.from, lt: input.to } },
          {
            dueAt: null,
            dueDate: { gte: fromDate, lt: toDate },
          },
        ],
        calendarLinks: { none: { removedAt: null } },
      },
      include: taskInclude,
      orderBy: [
        { dueDate: 'asc' },
        { dueTimeMinutes: { sort: 'asc', nulls: 'first' } },
        { id: 'asc' },
      ],
      take: 500,
    });
    return tasks.map(toTaskRecord);
  }
}
