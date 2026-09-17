import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Local / CI placeholder. Real credentials come from DATABASE_URL.
    url: process.env.DATABASE_URL ?? "postgres://board:board@localhost:5432/board",
  },
  strict: true,
  verbose: true,
});
