/**
 * Server-side session resolution.
 *
 * BOARD is wallet-only: sessions are issued by `wallet-auth.service` after a
 * signature check. The email/password register and login paths were removed
 * along with the UI that used them.
 */
import { and, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { hashSessionToken } from "@/server/lib/session-token";
import { isDbConfigured as dbConfigured } from "@/server/lib/db-config";
import { defineServiceError } from "@/server/lib/service-error";

export const AuthError = defineServiceError("AuthError");

export type AuthUserView = {
  id: string;
  username: string;
  email: string | null;
  avatarId: string | null;
  balance: number;
};

export type AuthSessionResult = {
  user: AuthUserView;
  session: {
    token: string;
    expiresAt: string;
  };
  source: "database" | "mock";
};

/** Shape a `users` row for the client. Shared with `wallet-auth.service`. */
export function mapUser(row: typeof users.$inferSelect): AuthUserView {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarId: row.avatarId,
    balance: Number(row.balance),
  };
}

/**
 * Resolve an active session from a raw token (cookie / Bearer / header).
 */
export async function resolveSessionToken(token: string | null | undefined) {
  if (!token?.trim()) return null;
  const raw = token.trim();

  if (!dbConfigured()) {
    if (!raw.startsWith("mock_")) return null;

    const { resolveMockWalletSession } = await import(
      "@/server/services/wallet-auth.service"
    );
    const walletSession = resolveMockWalletSession(raw);
    if (walletSession) {
      return {
        user: walletSession.user,
        sessionId: "mock-wallet-session",
        walletAddress: walletSession.address,
        source: "mock" as const,
      };
    }

    return null;
  }

  const tokenHash = hashSessionToken(raw);
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row || row.user.walletSecurityHold) return null;

  await db
    .update(sessions)
    .set({ lastSeenAt: now })
    .where(eq(sessions.id, row.session.id));

  return {
    user: mapUser(row.user),
    sessionId: row.session.id,
    walletAddress: row.session.walletAddress,
    source: "database" as const,
  };
}
