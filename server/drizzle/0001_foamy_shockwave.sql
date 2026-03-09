CREATE TYPE "public"."message_role" AS ENUM('user', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('idle', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_compiler" AS ENUM('maven', 'gradle');--> statement-breakpoint
CREATE TYPE "public"."project_language" AS ENUM('java', 'kotlin');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "agent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"log_type" varchar(32) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "agent_status" DEFAULT 'idle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"software" varchar(32) DEFAULT 'paper' NOT NULL,
	"language" "project_language" DEFAULT 'java' NOT NULL,
	"java_version" varchar(8) DEFAULT '21' NOT NULL,
	"compiler" "project_compiler" DEFAULT 'gradle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_session_id_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_session_id_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_logs_session_id_idx" ON "agent_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_messages_session_id_idx" ON "agent_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_sessions_project_id_idx" ON "agent_sessions" USING btree ("project_id");