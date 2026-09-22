import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { verifyMessage } from "viem";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { buildWalletVerifyMessage } from "@/lib/wallet/siwe";
import { getDb } from "@/server/db";
import { userBalances, wallets } from "@/server/db/schema";
import { isDbConfigured } from "@/server/lib/db-config";
import { ServiceError } from "@/server/lib/service-error";
import { assertWalletAccount, WALLET_OWNERSHIP_VERSION, withWalletIdentity } from "@/server/lib/wallet-identity";

export class WalletLinkError extends ServiceError {
  constructor(message: string, status = 400) {
    super(message, status);
    this.name = "WalletLinkError";
  }
}

export type WalletView = {
  id: string;
  address: string;
  chain: string;
  isPrimary: boolean;
  verified: boolean;
  verifiedAt: string | null;
  verifyNonce: string | null;
  verifyMessage?: string | null;
  verifyExpiresAt?: string | null;
  label: string | null;
};

function normalizeAddress(address: string) {
  const value = address.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(value)) throw new WalletLinkError("Invalid EVM wallet address.");
  return value;
}

function mapWallet(row: typeof wallets.$inferSelect): WalletView {
  const trusted = Boolean(row.verifiedAt && row.ownershipVersion === WALLET_OWNERSHIP_VERSION && row.chain === ROBINHOOD_CHAIN_LABEL);
  return {
    id: row.id, address: row.address, chain: row.chain,
    isPrimary: trusted && row.isPrimary, verified: trusted,
    verifiedAt: trusted ? row.verifiedAt!.toISOString() : null,
    verifyNonce: row.verifyNonce,
    verifyMessage: row.verifyNonce ? buildWalletVerifyMessage({ address: row.address, nonce: row.verifyNonce, accountId: row.userId }) : null,
    verifyExpiresAt: row.verifyExpiresAt?.toISOString() ?? null,
    label: row.label,
  };
}

/** Pending links confer no authority and never change the trusted primary wallet. */
export async function connectWallet(input: {
  userId: string; address: string; chain?: string; label?: string; makePrimary?: boolean;
}): Promise<{ wallet: WalletView; source: "database" | "mock" }> {
  const address = normalizeAddress(input.address);
  if (input.chain && input.chain.trim() !== ROBINHOOD_CHAIN_LABEL)
    throw new WalletLinkError("Use the configured Robinhood network.", 400);
  if (!isDbConfigured())
    throw new WalletLinkError("Additional wallet linking requires the database. Sign in with the playing wallet instead.", 503);
  return withWalletIdentity(address, async (tx) => {
    await assertWalletAccount(tx, input.userId);
    const [existing] = await tx.select().from(wallets)
      .where(and(eq(wallets.chain, ROBINHOOD_CHAIN_LABEL), eq(wallets.address, address))).limit(1);
    if (existing?.verifiedAt && existing.userId !== input.userId)
      throw new WalletLinkError("Wallet already linked to another account.", 409);
    if (existing?.verifiedAt && existing.ownershipVersion !== WALLET_OWNERSHIP_VERSION)
      throw new WalletLinkError("Legacy ownership requires account review.", 403);
    const now = new Date();
    const pending = {
      userId: input.userId, address, chain: ROBINHOOD_CHAIN_LABEL,
      verifyNonce: `board-${randomBytes(16).toString("hex")}`,
      verifyExpiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      pendingPrimary: input.makePrimary !== false,
      label: input.label ?? null, updatedAt: now,
    };
    const [row] = existing
      ? await tx.update(wallets).set(pending).where(eq(wallets.id, existing.id)).returning()
      : await tx.insert(wallets).values({ ...pending, isPrimary: false, createdAt: now }).returning();
    return { wallet: mapWallet(row), source: "database" as const };
  });
}

export async function verifyWallet(input: {
  userId: string; walletId?: string; address?: string; signature: string; message?: string;
}): Promise<{ wallet: WalletView; source: "database" | "mock" }> {
  if (!isDbConfigured()) throw new WalletLinkError("Additional wallet linking requires the database.", 503);
  if (!input.signature.trim()) throw new WalletLinkError("signature is required.");
  const address = input.address ? normalizeAddress(input.address) : undefined;
  const conditions = [eq(wallets.userId, input.userId), eq(wallets.chain, ROBINHOOD_CHAIN_LABEL)];
  if (input.walletId) conditions.push(eq(wallets.id, input.walletId));
  if (address) conditions.push(eq(wallets.address, address));
  if (!input.walletId && !address) throw new WalletLinkError("walletId or address is required.");
  const [candidate] = await getDb().select().from(wallets).where(and(...conditions)).limit(1);
  if (!candidate) throw new WalletLinkError("Wallet not found.", 404);
  return withWalletIdentity(candidate.address, async (tx) => {
    await assertWalletAccount(tx, input.userId);
    // Re-read ownership and nonce after acquiring the same lock used by login/reclaim.
    const [row] = await tx.select().from(wallets).where(and(...conditions, eq(wallets.id, candidate.id))).limit(1);
    if (!row || !row.verifyNonce || !row.verifyExpiresAt || row.verifyExpiresAt.getTime() <= Date.now())
      throw new WalletLinkError("Link challenge expired or changed. Reconnect the wallet.", 401);
    const message = buildWalletVerifyMessage({ address: row.address, nonce: row.verifyNonce, accountId: input.userId });
    if (input.message && input.message !== message)
      throw new WalletLinkError("Signed message does not match this account's link challenge.", 401);
    let valid = false;
    try {
      valid = await verifyMessage({ address: row.address as `0x${string}`, message, signature: input.signature.trim() as `0x${string}` });
    } catch { valid = false; }
    if (!valid) throw new WalletLinkError("Invalid wallet signature.", 401);
    const now = new Date();
    if (row.pendingPrimary) await tx.update(wallets).set({ isPrimary: false, updatedAt: now }).where(eq(wallets.userId, input.userId));
    const [updated] = await tx.update(wallets).set({
      verifiedAt: now, ownershipVersion: WALLET_OWNERSHIP_VERSION,
      verifyNonce: null, verifyExpiresAt: null, pendingPrimary: false,
      isPrimary: row.pendingPrimary || row.isPrimary, updatedAt: now,
    }).where(and(eq(wallets.id, row.id), eq(wallets.userId, input.userId), eq(wallets.verifyNonce, row.verifyNonce))).returning();
    if (!updated) throw new WalletLinkError("Link challenge changed. Reconnect the wallet.", 409);
    if (updated.isPrimary) await tx.insert(userBalances).values({
      userId: input.userId, available: "0", chain: updated.chain, walletAddress: updated.address, updatedAt: now,
    }).onConflictDoUpdate({ target: userBalances.userId, set: { walletAddress: updated.address, chain: updated.chain, updatedAt: now } });
    return { wallet: mapWallet(updated), source: "database" as const };
  });
}

export async function listWallets(userId: string): Promise<{ wallets: WalletView[]; source: "database" | "mock" }> {
  if (!isDbConfigured()) return { wallets: [], source: "mock" };
  const rows = await getDb().select().from(wallets).where(eq(wallets.userId, userId));
  return { wallets: rows.map(mapWallet), source: "database" };
}
