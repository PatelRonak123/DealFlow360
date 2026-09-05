CREATE TABLE "recommendation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_product_id" uuid NOT NULL,
	"recommended_product_id" uuid NOT NULL,
	"recommendation_type" varchar(50) NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"default_quantity" integer DEFAULT 1 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"recommendation_rule_id" uuid,
	"recommended_product_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_price" numeric(12, 2),
	"additional_revenue" numeric(12, 2),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendation_rules" ADD CONSTRAINT "recommendation_rules_source_product_id_products_id_fk" FOREIGN KEY ("source_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_rules" ADD CONSTRAINT "recommendation_rules_recommended_product_id_products_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_recommendation_rule_id_recommendation_rules_id_fk" FOREIGN KEY ("recommendation_rule_id") REFERENCES "public"."recommendation_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_recommended_product_id_products_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rec_rules_source_idx" ON "recommendation_rules" USING btree ("source_product_id");--> statement-breakpoint
CREATE INDEX "rec_rules_recommended_idx" ON "recommendation_rules" USING btree ("recommended_product_id");--> statement-breakpoint
CREATE INDEX "rec_rules_is_active_idx" ON "recommendation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rec_events_quotation_idx" ON "recommendation_events" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "rec_events_rule_idx" ON "recommendation_events" USING btree ("recommendation_rule_id");--> statement-breakpoint
CREATE INDEX "rec_events_product_idx" ON "recommendation_events" USING btree ("recommended_product_id");--> statement-breakpoint
CREATE INDEX "rec_events_type_idx" ON "recommendation_events" USING btree ("event_type");
