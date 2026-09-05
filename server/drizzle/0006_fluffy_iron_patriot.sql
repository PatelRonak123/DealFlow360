CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"pincode" varchar(20),
	"priority" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_name_unique" UNIQUE("name"),
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "warehouse_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid,
	"warehouse_id" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_on_hand_after" integer,
	"reserved_quantity_after" integer,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fulfillment_number" varchar(50) NOT NULL,
	"quotation_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"allocated_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fulfillments_fulfillment_number_unique" UNIQUE("fulfillment_number")
);
--> statement-breakpoint
CREATE TABLE "fulfillment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fulfillment_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"allocated_quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'ALLOCATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backorders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fulfillment_id" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"required_quantity" integer NOT NULL,
	"allocated_quantity" integer NOT NULL,
	"backordered_quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_product_id_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_id_warehouse_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."warehouse_inventory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_allocations" ADD CONSTRAINT "fulfillment_allocations_fulfillment_id_fulfillments_id_fk" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_allocations" ADD CONSTRAINT "fulfillment_allocations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillment_allocations" ADD CONSTRAINT "fulfillment_allocations_product_id_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backorders" ADD CONSTRAINT "backorders_fulfillment_id_fulfillments_id_fk" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backorders" ADD CONSTRAINT "backorders_product_id_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_warehouses_code" ON "warehouses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_warehouses_is_active" ON "warehouses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_warehouses_priority" ON "warehouses" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wh_inv_unique_wh_product" ON "warehouse_inventory" USING btree ("warehouse_id","productId");--> statement-breakpoint
CREATE INDEX "idx_wh_inv_warehouse_id" ON "warehouse_inventory" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_wh_inv_product_id" ON "warehouse_inventory" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "idx_inv_tx_warehouse_id" ON "inventory_transactions" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_inv_tx_product_id" ON "inventory_transactions" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "idx_inv_tx_type" ON "inventory_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_inv_tx_created_at" ON "inventory_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_fulfillments_quotation_id" ON "fulfillments" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "idx_fulfillments_status" ON "fulfillments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fulfillments_number" ON "fulfillments" USING btree ("fulfillment_number");--> statement-breakpoint
CREATE INDEX "idx_ful_alloc_fulfillment_id" ON "fulfillment_allocations" USING btree ("fulfillment_id");--> statement-breakpoint
CREATE INDEX "idx_ful_alloc_warehouse_id" ON "fulfillment_allocations" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_ful_alloc_product_id" ON "fulfillment_allocations" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "idx_ful_alloc_status" ON "fulfillment_allocations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_backorders_fulfillment_id" ON "backorders" USING btree ("fulfillment_id");--> statement-breakpoint
CREATE INDEX "idx_backorders_product_id" ON "backorders" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "idx_backorders_status" ON "backorders" USING btree ("status");
