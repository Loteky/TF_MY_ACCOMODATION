CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OFFICER', 'MODERATOR', 'ADMIN');

CREATE TYPE "RentCycle" AS ENUM ('monthly', 'yearly');

CREATE TYPE "ListingStatus" AS ENUM ('draft', 'published', 'under_offer', 'transferred', 'withdrawn');

CREATE TYPE "InterestStatus" AS ENUM ('open', 'shortlisted', 'declined', 'accepted');

CREATE TYPE "TransferStatus" AS ENUM ('pending_landlord', 'approved', 'rejected', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "service_number_hash" TEXT NOT NULL UNIQUE,
    "official_email" TEXT NOT NULL UNIQUE,
    "full_name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OFFICER',
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "ip" TEXT,
    "ua" TEXT
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "geo_area" TEXT,
    "rent_amount" NUMERIC(12,2) NOT NULL,
    "rent_currency" TEXT NOT NULL,
    "rent_cycle" "RentCycle" NOT NULL,
    "deposit_amount" NUMERIC(12,2),
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "furnished" BOOLEAN NOT NULL,
    "amenities" JSONB NOT NULL,
    "exact_address_enc" TEXT NOT NULL,
    "available_from" DATE NOT NULL,
    "next_rent_due" DATE,
    "photos" JSONB NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable
CREATE TABLE "interests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
    "interested_officer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "message" TEXT NOT NULL,
    "status" "InterestStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
    "from_officer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "to_officer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "proposed_move_in" DATE NOT NULL,
    "effective_date" DATE,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending_landlord',
    "consent_pdf_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "sessions_user_idx" ON "sessions"("user_id");
CREATE INDEX "listings_owner_idx" ON "listings"("owner_id");
CREATE INDEX "interests_listing_idx" ON "interests"("listing_id");
CREATE INDEX "transfers_listing_idx" ON "transfers"("listing_id");
