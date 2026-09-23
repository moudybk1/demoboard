/**
 * rooms · open / in-progress / finished game tables in the lobby.
 * Each room is one Monopoly or Ludo table with a fixed entry fee and max of 4.
 */
import {
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { gameTypeEnum, roomStatusEnum } from "./enums";

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameType: gameTypeEnum("game_type").notNull(),
  /** Entry fee in $USDG charged when a player joins. */
  entryFee: numeric("entry_fee", { precision: 20, scale: 2 }).notNull(),
  maxPlayers: integer("max_players").notNull().default(4),
  status: roomStatusEnum("status").notNull().default("waiting"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoomRow = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
