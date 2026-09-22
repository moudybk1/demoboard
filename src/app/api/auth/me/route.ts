import { NextResponse } from "next/server";

import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { readSessionToken } from "@/server/lib/request-session";
import { resolveSessionToken } from "@/server/services/auth.service";
import {
  resolveMockWalletSession,
} from "@/server/services/wallet-auth.service";
import { listWallets } from "@/server/services/wallet-link.service";

/**
 * GET /api/auth/me · current session user + primary wallet (wallet-only accounts).
 */
export async function GET(request: Request) {
  const token = readSessionToken(request);
  const session = await resolveSessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { wallets, source } = await listWallets(session.user.id);
  let primary =
    wallets.find((wallet) => wallet.verified && wallet.address.toLowerCase() === session.walletAddress?.toLowerCase()) ??
    wallets.find((wallet) => wallet.isPrimary && wallet.verified) ??
    wallets.find((wallet) => wallet.verified) ??
    null;

  if (!primary && token?.startsWith("mock_")) {
    const mock = resolveMockWalletSession(token);
    if (mock) {
      primary = {
        id: "wal_mock",
        address: mock.address,
        chain: ROBINHOOD_CHAIN_LABEL,
        isPrimary: true,
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifyNonce: null,
        label: null,
      };
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    wallet: primary
      ? {
          address: primary.address,
          chain: primary.chain,
          verified: primary.verified,
        }
      : null,
    source,
  });
}
