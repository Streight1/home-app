-- Historical template application batches remain useful for safe rollback even
-- after their source template is removed. The generated events keep their own
-- immutable event data, while this pointer becomes optional.
ALTER TABLE "CalendarTemplateApplicationBatch"
    DROP CONSTRAINT "CalendarTemplateApplicationBatch_templateId_fkey";

ALTER TABLE "CalendarTemplateApplicationBatch"
    ALTER COLUMN "templateId" DROP NOT NULL;

ALTER TABLE "CalendarTemplateApplicationBatch"
    ADD CONSTRAINT "CalendarTemplateApplicationBatch_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "CalendarTemplate"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
