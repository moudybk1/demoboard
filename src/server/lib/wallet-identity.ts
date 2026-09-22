import { eq, sql } from "drizzle-orm";
import { getDb, type Db } from "@/server/db";
import { users } from "@/server/db/schema";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { ServiceError } from "@/server/lib/service-error";

export const WALLET_OWNERSHIP_VERSION = 2;
export type WalletTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Login, pending-link creation and verification share the exact identity lock. */
export function withWalletIdentity<T>(address: string, run: (tx: WalletTransaction) => Promise<T>) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`wallet:${ROBINHOOD_CHAIN_LABEL}:${address.toLowerCase()}`}))`);
    return run(tx);
  });
}

export async function assertWalletAccount(tx: WalletTransaction, userId: string) {
  const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1).for("update");
  if (!user || user.walletSecurityHold)
    throw new ServiceError("Account ownership review required. Balances and matches are preserved; contact support.", 403);
  return user;
}
