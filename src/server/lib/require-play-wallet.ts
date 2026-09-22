import type { Hex } from "viem";
import { readSessionToken } from "@/server/lib/request-session";
import { ServiceError } from "@/server/lib/service-error";
import { resolveSessionToken } from "@/server/services/auth.service";
import { resolveMockWalletSession } from "@/server/services/wallet-auth.service";
import { listWallets } from "@/server/services/wallet-link.service";

/** Public transaction hashes and wallet addresses are not authentication. */
export async function requirePlayWallet(
  request: Request,
  expected?: string,
): Promise<Hex> {
  const token = readSessionToken(request);
  const session = await resolveSessionToken(token);
  if (!session)
    throw new ServiceError(
      "Sign in with your playing wallet to continue.",
      401,
    );
  const mock =
    !process.env.DATABASE_URL && token ? resolveMockWalletSession(token) : null;
  const addresses = mock
    ? [mock.address]
    : (await listWallets(session.user.id)).wallets
        .filter((wallet) => wallet.verified)
        .map((wallet) => wallet.address);
  const address = expected
    ? addresses.find((value) => value.toLowerCase() === expected.toLowerCase())
    : addresses[0];
  if (!address)
    throw new ServiceError("Use the wallet that paid for this seat.", 403);
  return address.toLowerCase() as Hex;
}
