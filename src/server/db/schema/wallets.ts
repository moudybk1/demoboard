/**
 * wallets · linked chain addresses per user (Robinhood Chain first).
 * Verification (SIWE-style nonce + signed message) lands in later API tasks.
 */
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    chain: text("chain").notNull().default("Robinhood Chain"),
    /** Primary withdraw / deposit destination for the account. */
    isPrimary: boolean("is_primary").notNull().default(false),
    /** Challenge nonce for signature verification. */
    verifyNonce: text("verify_nonce"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ownershipVersion: integer("ownership_version").notNull().default(0),
    verifyExpiresAt: timestamp("verify_expires_at", { withTimezone: true }),
    pendingPrimary: boolean("pending_primary").notNull().default(false),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("wallets_chain_address_uidx").on(table.chain, table.address),
    index("wallets_user_idx").on(table.userId),
  ],
);

export type WalletRow = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
