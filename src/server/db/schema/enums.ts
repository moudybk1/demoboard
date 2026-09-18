/**
 * Shared Postgres enums for lobby, game, wallet, and reward tables.
 */
import { pgEnum } from "drizzle-orm/pg-core";

export const gameTypeEnum = pgEnum("game_type", ["monopoly", "ludo"]);

export const roomStatusEnum = pgEnum("room_status", [
  "waiting",
  "playing",
  "finished",
]);

export const roomPlayerStatusEnum = pgEnum("room_player_status", [
  "alive",
  "eliminated",
  "finished",
]);

export const matchStatusEnum = pgEnum("match_status", ["ongoing", "settled"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdraw",
  "entry_fee",
  "payout",
  "fee",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
]);

/** Winner payout lifecycle after a match settles. */
export const rewardPayoutStatusEnum = pgEnum("reward_payout_status", [
  "pending",
  "paid",
  "failed",
]);

/** Fee ledger row kind · development treasury, buyback, or burn. */
export const feeLedgerKindEnum = pgEnum("fee_ledger_kind", [
  "treasury",
  "buyback",
  "burn",
]);
