CREATE TABLE "quotation_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"approval_level" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"sequence" integer NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by_id" uuid,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_discount_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"quotation_item_id" uuid NOT NULL,
	"applied_discount" numeric(5, 2) NOT NULL,
	"customer_tier_limit" numeric(5, 2) NOT NULL,
	"category_limit" numeric(5, 2) NOT NULL,
	"effective_allowed_discount" numeric(5, 2) NOT NULL,
	"excess_discount" numeric(5, 2) NOT NULL,
	"is_violation" boolean DEFAULT false NOT NULL,
	"risk_contribution" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_approvals" ADD CONSTRAINT "quotation_approvals_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_approvals" ADD CONSTRAINT "quotation_approvals_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_discount_evaluations" ADD CONSTRAINT "quotation_discount_evaluations_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_discount_evaluations" ADD CONSTRAINT "quotation_discount_evaluations_quotation_item_id_quotation_items_id_fk" FOREIGN KEY ("quotation_item_id") REFERENCES "public"."quotation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quotation_approvals_quotation_id" ON "quotation_approvals" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "idx_quotation_approvals_status" ON "quotation_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quotation_approvals_level" ON "quotation_approvals" USING btree ("approval_level");--> statement-breakpoint
CREATE INDEX "idx_qde_quotation_id" ON "quotation_discount_evaluations" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "idx_qde_quotation_item_id" ON "quotation_discount_evaluations" USING btree ("quotation_item_id");