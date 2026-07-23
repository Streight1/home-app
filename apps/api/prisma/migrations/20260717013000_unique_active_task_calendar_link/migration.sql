CREATE UNIQUE INDEX "TaskCalendarLink_one_active_per_task_idx"
  ON "TaskCalendarLink"("taskId")
  WHERE "removedAt" IS NULL;
