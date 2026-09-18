import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import type * as schema from "@/server/db/schema";
import { feeLedger } from "@/server/db/schema";
import { getRoomEconomyConfig } from "@/server/services/economy.service";

type DbTx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type BuybackFeeInput = {
  rewardPayoutId: string;
  matchId: string;
  feeAmount: number;
  txHash?: string;
};

/**
 * Record the buyback share of the 2% prize fee (default 35% of the fee).
 */
export async function recordBuybackFee(tx: DbTx, input: BuybackFeeInput) {
  const config = getRoomEconomyConfig();
  const amount =
    Math.round(input.feeAmount * config.feeDestination.buybackShare * 100) /
    100;

  const [row] = await tx
    .insert(feeLedger)
    .values({
      rewardPayoutId: input.rewardPayoutId,
      matchId: input.matchId,
      kind: "buyback",
      amount: amount.toFixed(2),
      txHash: input.txHash ?? null,
      note: "2% prize fee → $BOARD buyback",
    })
    .returning();

  return {
    id: row.id,
    kind: "buyback" as const,
    amount,
  };
}

/** Pure helper for docs / API examples. */
export function buybackShareOfFee(feeAmount: number) {
  const config = getRoomEconomyConfig();
  return (
    Math.round(feeAmount * config.feeDestination.buybackShare * 100) / 100
  );
}
