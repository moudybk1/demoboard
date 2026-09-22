import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

/** Locked server snapshots for paid tables, matches and treasury transaction intents. */
export const playDocuments = pgTable("play_documents", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
