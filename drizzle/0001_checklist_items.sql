CREATE TYPE "public"."checklist_type" AS ENUM('pre_event', 'post_event');--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"type" "checklist_type" NOT NULL,
	"label" varchar(500) NOT NULL,
	"is_checked" boolean NOT NULL DEFAULT false,
	"checked_by" uuid,
	"checked_at" timestamp,
	"sort_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "checklist_items_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE,
	CONSTRAINT "checklist_items_checked_by_fk" FOREIGN KEY ("checked_by") REFERENCES "profiles"("id") ON DELETE SET NULL
);--> statement-breakpoint
CREATE INDEX "checklist_items_job_idx" ON "checklist_items" ("job_id");--> statement-breakpoint
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
