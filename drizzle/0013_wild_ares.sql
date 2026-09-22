ALTER TYPE "public"."fee_ledger_kind" ADD VALUE 'buyback' BEFORE 'burn';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_security_hold" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "ownership_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "verify_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "pending_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "wallet_address" text;--> statement-breakpoint
-- Historical links cannot prove which account originally controlled the wallet.
-- Quarantine, never delete or reassign, all pre-migration wallet accounts.
UPDATE "users" SET "wallet_security_hold" = true
WHERE "id" IN (SELECT "user_id" FROM "wallets");--> statement-breakpoint
UPDATE "sessions" SET "revoked_at" = now()
WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "wallet_security_hold" = true)
AND "revoked_at" IS NULL;
