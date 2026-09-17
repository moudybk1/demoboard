/**
 * Player profile updates (username + pixel avatar).
 */
import { eq } from "drizzle-orm";

import { MOCK_ACCOUNT } from "@/lib/mock/account";
import { MOCK_PLAYER } from "@/lib/mock/lobby";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { isDbConfigured as dbConfigured } from "@/server/lib/db-config";

const AVATAR_IDS = new Set([
  "pawn-gold",
  "pawn-teal",
  "pawn-violet",
  "pawn-rose",
  "dice-ink",
  "crown-lite",
]);

export class ProfileError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProfileError";
    this.status = status;
  }
}

export type ProfileView = {
  id: string;
  username: string;
  email: string | null;
  avatarId: string | null;
  avatarUrl: string | null;
  balance: number;
  updatedAt: string;
};

function mapProfile(row: typeof users.$inferSelect): ProfileView {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarId: row.avatarId,
    avatarUrl: row.avatarUrl,
    balance: Number(row.balance),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeUsername(username: string): string {
  const name = username.trim();
  if (name.length < 3 || name.length > 24) {
    throw new ProfileError("Username must be 3 to 24 characters.");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new ProfileError("Username may only use letters, numbers, and _.");
  }
  return name;
}

export async function getProfile(userId: string): Promise<{
  profile: ProfileView;
  source: "database" | "mock";
}> {
  if (!dbConfigured()) {
    return {
      profile: {
        id: userId === "me" ? MOCK_PLAYER.id : userId,
        username: MOCK_ACCOUNT.username,
        email: MOCK_ACCOUNT.email,
        avatarId: MOCK_ACCOUNT.avatarId,
        avatarUrl: null,
        balance: 0,
        updatedAt: MOCK_ACCOUNT.joinedAt,
      },
      source: "mock",
    };
  }

  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) {
    throw new ProfileError("Profile not found.", 404);
  }
  return { profile: mapProfile(row), source: "database" };
}

export async function updateProfile(input: {
  userId: string;
  username?: string;
  avatarId?: string;
  avatarUrl?: string | null;
}): Promise<{ profile: ProfileView; source: "database" | "mock" }> {
  if (
    input.username === undefined &&
    input.avatarId === undefined &&
    input.avatarUrl === undefined
  ) {
    throw new ProfileError("No profile fields to update.");
  }

  if (input.avatarId !== undefined && !AVATAR_IDS.has(input.avatarId)) {
    throw new ProfileError("Unknown pixel avatar id.");
  }

  if (!dbConfigured()) {
    return {
      profile: {
        id: input.userId === "me" ? MOCK_PLAYER.id : input.userId,
        username: input.username
          ? normalizeUsername(input.username)
          : MOCK_ACCOUNT.username,
        email: MOCK_ACCOUNT.email,
        avatarId: input.avatarId ?? MOCK_ACCOUNT.avatarId,
        avatarUrl: input.avatarUrl ?? null,
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
      source: "mock",
    };
  }

  const db = getDb();
  const patch: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.username !== undefined) {
    patch.username = normalizeUsername(input.username);
  }
  if (input.avatarId !== undefined) {
    patch.avatarId = input.avatarId;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatarUrl = input.avatarUrl;
  }

  try {
    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, input.userId))
      .returning();

    if (!updated) {
      throw new ProfileError("Profile not found.", 404);
    }

    return { profile: mapProfile(updated), source: "database" };
  } catch (error) {
    if (error instanceof ProfileError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("users_username_unique")) {
      throw new ProfileError("Username is already taken.", 409);
    }
    throw error;
  }
}
