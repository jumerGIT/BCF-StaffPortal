CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."assignment_role" AS ENUM('site_head', 'driver', 'crew');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'late', 'absent');--> statement-breakpoint
CREATE TYPE "public"."audit_role" AS ENUM('staff', 'site_head', 'manager', 'admin');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('self_clockin', 'site_head', 'admin_manual');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('bcf_birthday', 'corporate', 'other');--> statement-breakpoint
CREATE TYPE "public"."phase" AS ENUM('prep', 'transit', 'setup', 'live', 'teardown');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('pending', 'active', 'done');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'manager', 'site_head', 'staff');--> statement-breakpoint
CREATE TYPE "public"."van_status" AS ENUM('available', 'in_use', 'maintenance');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_by_role" "audit_role" NOT NULL,
	"action" varchar(100) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"van_id" uuid,
	"role" "assignment_role" DEFAULT 'crew' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_assignments_job_id_user_id_unique" UNIQUE("job_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "job_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"phase" "phase" NOT NULL,
	"status" "phase_status" DEFAULT 'pending' NOT NULL,
	"updated_by" uuid,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_phases_job_id_phase_unique" UNIQUE("job_id","phase")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "job_type" DEFAULT 'bcf_birthday' NOT NULL,
	"venue" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"shift_start" time NOT NULL,
	"shift_end" time NOT NULL,
	"status" "job_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"van_id" uuid,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"total_hours" numeric(5, 2),
	"is_overtime" boolean DEFAULT false NOT NULL,
	"entry_source" "entry_source" DEFAULT 'self_clockin' NOT NULL,
	"entered_by" uuid NOT NULL,
	"site_head_note" text,
	"attendance_status" "attendance_status" DEFAULT 'present' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"plate" varchar(20),
	"status" "van_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_van_id_vans_id_fk" FOREIGN KEY ("van_id") REFERENCES "public"."vans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_phases" ADD CONSTRAINT "job_phases_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_phases" ADD CONSTRAINT "job_phases_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_van_id_vans_id_fk" FOREIGN KEY ("van_id") REFERENCES "public"."vans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_entered_by_profiles_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_entries_job_idx" ON "time_entries" USING btree ("job_id");