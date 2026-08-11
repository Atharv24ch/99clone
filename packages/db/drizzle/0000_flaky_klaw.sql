CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller', 'agent', 'builder', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."facing" AS ENUM('north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west');--> statement-breakpoint
CREATE TYPE "public"."furnishing_status" AS ENUM('unfurnished', 'semi_furnished', 'fully_furnished');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('buy', 'rent', 'pg', 'commercial_buy', 'commercial_rent', 'plot_buy', 'plot_rent', 'new_project');--> statement-breakpoint
CREATE TYPE "public"."possession_status" AS ENUM('ready_to_move', 'under_construction', 'new_launch');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('draft', 'active', 'pending_approval', 'rejected', 'sold', 'rented', 'archived');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'independent_house', 'villa', 'plot', 'commercial_office', 'commercial_shop', 'warehouse', 'pg_hostel', 'farmhouse');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('property_page', 'search_results', 'map_view', 'featured_ad', 'organic', 'whatsapp', 'phone');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'visited', 'negotiating', 'converted', 'lost', 'spam');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('pre_launch', 'new_launch', 'under_construction', 'ready_to_move', 'completed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(128),
	"email" varchar(256),
	"phone" varchar(20),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"avatar_url" text,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"rera_number" varchar(64),
	"agency_name" varchar(256),
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" varchar(64),
	"icon" varchar(64),
	CONSTRAINT "amenities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(512) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"listing_type" "listing_type" NOT NULL,
	"property_type" "property_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" uuid,
	"price" numeric(16, 2) NOT NULL,
	"price_per_sq_ft" numeric(12, 2),
	"is_negotiable" boolean DEFAULT false NOT NULL,
	"built_up_area" numeric(10, 2),
	"carpet_area" numeric(10, 2),
	"plot_area" numeric(10, 2),
	"bedrooms" smallint,
	"bathrooms" smallint,
	"balconies" smallint,
	"floor_number" smallint,
	"total_floors" smallint,
	"parking_covered" smallint DEFAULT 0,
	"parking_open" smallint DEFAULT 0,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"furnishing_status" "furnishing_status",
	"possession_status" "possession_status",
	"possession_date" timestamp with time zone,
	"facing" "facing",
	"age_of_property" smallint,
	"address" text NOT NULL,
	"locality" varchar(256) NOT NULL,
	"city" varchar(128) NOT NULL,
	"state" varchar(128) NOT NULL,
	"pincode" varchar(10),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"location" geometry(Point, 4326),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"lead_count" integer DEFAULT 0 NOT NULL,
	"meta" jsonb,
	"listed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_amenities" (
	"property_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"s3_key" varchar(1024) NOT NULL,
	"cdn_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"mime_type" varchar(64),
	"is_watermarked" boolean DEFAULT false NOT NULL,
	"is_cover_image" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"buyer_id" uuid,
	"owner_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(256),
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"source" "lead_source" DEFAULT 'property_page' NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"first_contact_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "localities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"city" varchar(128) NOT NULL,
	"state" varchar(128) NOT NULL,
	"pincode" varchar(10),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"property_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(512) NOT NULL,
	"name" varchar(512) NOT NULL,
	"description" text,
	"builder_id" uuid NOT NULL,
	"status" "project_status" DEFAULT 'new_launch' NOT NULL,
	"address" text NOT NULL,
	"locality" varchar(256) NOT NULL,
	"city" varchar(128) NOT NULL,
	"state" varchar(128) NOT NULL,
	"pincode" varchar(10),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"total_units" integer,
	"total_towers" integer,
	"min_price" numeric(16, 2),
	"max_price" numeric(16, 2),
	"min_area" numeric(10, 2),
	"max_area" numeric(10, 2),
	"launch_date" timestamp with time zone,
	"completion_date" timestamp with time zone,
	"rera_number" varchar(128),
	"website_url" text,
	"brochure_url" text,
	"cover_image_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(256),
	"filters" text NOT NULL,
	"alert_enabled" boolean DEFAULT false NOT NULL,
	"last_alert_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_builder_id_users_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_owner_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_listing_type_idx" ON "properties" USING btree ("listing_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_property_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_locality_idx" ON "properties" USING btree ("locality");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_price_idx" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_bedrooms_idx" ON "properties" USING btree ("bedrooms");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_featured_idx" ON "properties" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_slug_idx" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_location_gist_idx" ON "properties" USING gist (location);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_locality_trgm_idx" ON "properties" USING gin (locality gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_title_trgm_idx" ON "properties" USING gin (title gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_amenities_property_idx" ON "property_amenities" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_images_property_idx" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "property_images_cover_idx" ON "property_images" USING btree ("property_id","is_cover_image");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_properties_user_idx" ON "saved_properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_properties_property_idx" ON "saved_properties" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_property_idx" ON "leads" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_owner_idx" ON "leads" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_buyer_idx" ON "leads" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_city_idx" ON "localities" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_name_idx" ON "localities" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_builder_idx" ON "projects" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_city_idx" ON "projects" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_featured_idx" ON "projects" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");