import { eq, sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import type * as schema from "@/server/db/schema";
import {
  rewardPayouts,
  transactions,
  userBalances,
  users,
} from "@/server/db/schema";
import { recordBurnFee } from "@/server/services/burn-fee.service";
import { recordBuybackFee } from "@/server/services/buyback-fee.service";
import { calculateRoomEconomy } from "@/server/services/economy.service";
import { recordTreasuryFee } from "@/server/services/treasury-fee.service";

type DbTx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type PayMatchRewardInput = {
  matchId: string;
  roomId: string;
  winnerUserId: string;
  gameType: "monopoly" | "ludo";
  entryFee: number;
  seats: number;
  grossPot?: number;
};

export type PayMatchRewardResult = {
  rewardPayoutId: string;
  grossPot: number;
  feeAmount: number;
  treasuryAmount: number;
  buybackAmount: number;
  burnAmount: number;
  netPayout: number;
  /** Off-chain credit is done; on-chain proof arrives via payment webhook. */
  status: "pending";
};

/**
 * Automatic winner payout after a match settles: credit net BOARD, insert
 * reward_payouts + fee_ledger (treasury / burn) + ledger transaction.
 */
export async function payMatchReward(
  tx: DbTx,
  input: PayMatchRewardInput,
): Promise<PayMatchRewardResult> {
  const economy = calculateRoomEconomy(input.entryFee, input.seats);
  const grossPot = input.grossPot ?? economy.grossPot;
  const feeAmount =
    input.grossPot !== undefined
      ? Math.round(grossPot * economy.feeRate * 100) / 100
      : economy.feeAmount;
  const netPayout = Math.round((grossPot - feeAmount) * 100) / 100;
  const now = new Date();

  const [winnerUser] = await tx
    .select()
    .from(users)
    .where(eq(users.id, input.winnerUserId))
    .limit(1)
    .for("update");

  if (!winnerUser) {
    throw new Error("Winner account missing.");
  }

  const balanceAfter = Number(winnerUser.balance) + netPayout;
  await tx
    .update(users)
    .set({ balance: balanceAfter.toFixed(2) })
    .where(eq(users.id, input.winnerUserId));

  await tx
    .insert(userBalances)
    .values({
      userId: input.winnerUserId,
      available: balanceAfter.toFixed(2),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userBalances.userId,
      set: {
        available: sql`${userBalances.available} + ${netPayout.toFixed(2)}`,
        updatedAt: now,
      },
    });

  const [payout] = await tx
    .insert(rewardPayouts)
    .values({
      matchId: input.matchId,
      roomId: input.roomId,
      winnerUserId: input.winnerUserId,
      gameType: input.gameType,
      entryFee: input.entryFee.toFixed(2),
      seats: String(input.seats),
      grossPot: grossPot.toFixed(2),
      feePercent: (economy.feeRate * 100).toFixed(2),
      feeAmount: feeAmount.toFixed(2),
      treasuryAmount: "0",
      burnAmount: "0",
      netPayout: netPayout.toFixed(2),
      status: "pending",
      note: "Credited off chain. Awaiting on chain confirmation",
      paidAt: null,
      createdAt: now,
    })
    .returning();

  const treasuryRow = await recordTreasuryFee(tx, {
    rewardPayoutId: payout.id,
    matchId: input.matchId,
    feeAmount,
  });
  const buybackRow = await recordBuybackFee(tx, {
    rewardPayoutId: payout.id,
    matchId: input.matchId,
    feeAmount,
  });
  const burnRow = await recordBurnFee(tx, {
    rewardPayoutId: payout.id,
    matchId: input.matchId,
    feeAmount,
  });

  await tx
    .update(rewardPayouts)
    .set({
      treasuryAmount: treasuryRow.amount.toFixed(2),
      burnAmount: burnRow.amount.toFixed(2),
    })
    .where(eq(rewardPayouts.id, payout.id));

  await tx.insert(transactions).values({
    userId: input.winnerUserId,
    type: "payout",
    status: "pending",
    amount: netPayout.toFixed(2),
    note: `Match payout ${input.matchId}`,
    referenceId: input.matchId,
    createdAt: now,
    updatedAt: now,
  });

  return {
    rewardPayoutId: payout.id,
    grossPot,
    feeAmount,
    treasuryAmount: treasuryRow.amount,
    buybackAmount: buybackRow.amount,
    burnAmount: burnRow.amount,
    netPayout,
    status: "pending",
  };
}
