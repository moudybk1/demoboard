import { desc, eq } from "drizzle-orm";

import { MOCK_WIN_HISTORY, MOCK_WIN_RESULT } from "@/lib/mock/wins";
import { getDb } from "@/server/db";
import { rewardPayouts, users } from "@/server/db/schema";
import { isDbConfigured as dbConfigured } from "@/server/lib/db-config";

function mapMock(win: typeof MOCK_WIN_RESULT) {
  return {
    id: win.id,
    matchId: win.id,
    roomId: win.roomId,
    gameType: win.gameType,
    winner: win.winner,
    entryFee: win.entryFee,
    seats: win.seats,
    grossPot: win.grossPot,
    feePercent: win.feePercent,
    feeAmount: win.feeAmount,
    treasuryAmount: win.treasuryAmount,
    buybackAmount: win.buybackAmount,
    burnAmount: win.burnAmount,
    netPayout: win.netPayout,
    status: win.payoutStatus,
    settledAt: win.settledAt,
    subtitle: win.subtitle,
  };
}

/**
 * List reward payouts for a user (win history), newest first.
 */
export async function listWinHistory(userId: string) {
  if (!dbConfigured()) {
    return {
      wins: MOCK_WIN_HISTORY.map(mapMock),
      source: "mock" as const,
    };
  }

  const db = getDb();
  const rows = await db
    .select({
      payout: rewardPayouts,
      username: users.username,
    })
    .from(rewardPayouts)
    .innerJoin(users, eq(users.id, rewardPayouts.winnerUserId))
    .where(eq(rewardPayouts.winnerUserId, userId))
    .orderBy(desc(rewardPayouts.createdAt));

  return {
    wins: rows.map(({ payout, username }) => ({
      id: payout.id,
      matchId: payout.matchId,
      roomId: payout.roomId,
      gameType: payout.gameType,
      winner: {
        userId: payout.winnerUserId,
        username,
        isYou: payout.winnerUserId === userId,
      },
      entryFee: Number(payout.entryFee),
      seats: Number(payout.seats),
      grossPot: Number(payout.grossPot),
      feePercent: Number(payout.feePercent),
      feeAmount: Number(payout.feeAmount),
      treasuryAmount: Number(payout.treasuryAmount),
      buybackAmount: Math.round(
        (Number(payout.feeAmount) -
          Number(payout.treasuryAmount) -
          Number(payout.burnAmount)) *
          100,
      ) / 100,
      burnAmount: Number(payout.burnAmount),
      netPayout: Number(payout.netPayout),
      status: payout.status,
      settledAt: (payout.paidAt ?? payout.createdAt).toISOString(),
      subtitle: payout.note,
    })),
    source: "database" as const,
  };
}

/**
 * Single reward payout detail by id.
 */
export async function getWinDetail(id: string, viewerUserId?: string) {
  if (!dbConfigured()) {
    const win =
      MOCK_WIN_HISTORY.find((item) => item.id === id) ??
      (id === MOCK_WIN_RESULT.id ? MOCK_WIN_RESULT : null);
    if (!win) return null;
    return { win: mapMock(win), source: "mock" as const };
  }

  const db = getDb();
  const [row] = await db
    .select({
      payout: rewardPayouts,
      username: users.username,
    })
    .from(rewardPayouts)
    .innerJoin(users, eq(users.id, rewardPayouts.winnerUserId))
    .where(eq(rewardPayouts.id, id))
    .limit(1);

  if (!row) return null;

  const { payout, username } = row;
  const feeAmount = Number(payout.feeAmount);
  const treasuryAmount = Number(payout.treasuryAmount);
  const burnAmount = Number(payout.burnAmount);
  return {
    win: {
      id: payout.id,
      matchId: payout.matchId,
      roomId: payout.roomId,
      gameType: payout.gameType,
      winner: {
        userId: payout.winnerUserId,
        username,
        isYou: viewerUserId
          ? payout.winnerUserId === viewerUserId
          : false,
      },
      entryFee: Number(payout.entryFee),
      seats: Number(payout.seats),
      grossPot: Number(payout.grossPot),
      feePercent: Number(payout.feePercent),
      feeAmount,
      treasuryAmount,
      buybackAmount:
        Math.round((feeAmount - treasuryAmount - burnAmount) * 100) / 100,
      burnAmount,
      netPayout: Number(payout.netPayout),
      status: payout.status,
      settledAt: (payout.paidAt ?? payout.createdAt).toISOString(),
      subtitle: payout.note,
      txHash: payout.txHash,
    },
    source: "database" as const,
  };
}
