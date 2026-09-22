/**
 * users · platform account + BOARD balance.
 * Auth fields (email, password hash, pixel avatar) support register/login;
 * `balance` is the spendable token balance held by the platform on the player's
 * behalf (deposits minus entry fees, plus net prizes). Locked entry fees for
 * rooms still in play are tracked via room_players / matches, not here.
 */
import {
  index,
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletSecurityHold: boolean("wallet_security_hold").notNull().default(false),
    username: text("username").notNull().unique(),
    /** Login email · unique when set (guest/mock rows may omit it). */
    email: text("email").unique(),
    /** scrypt / bcrypt hash; null for wallet-only or stub accounts. */
    passwordHash: text("password_hash"),
    /** Pixel avatar key from the account picker (e.g. pawn-gold). */
    avatarId: text("avatar_id").default("pawn-gold"),
    /** Optional remote avatar URL override. */
    avatarUrl: text("avatar_url"),
    /** Spendable BOARD balance on the platform. Numeric avoids float drift. */
    balance: numeric("balance", { precision: 20, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
