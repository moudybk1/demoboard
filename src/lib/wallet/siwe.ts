import {
  getBoardChainId,
  getBoardChainLabel,
} from "@/lib/wallet/chains";

/**
 * Ownership proof message signed by the wallet (EIP-191 personal_sign).
 * Must stay identical on client and server.
 */
export function buildWalletVerifyMessage(input: {
  address: string;
  nonce: string;
  domain?: string;
  chainId?: number;
  accountId?: string;
}): string {
  const domain =
    input.domain?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ||
    "board.local";
  const chainId = input.chainId ?? getBoardChainId();
  const address = input.address.trim().toLowerCase();

  return [
    `${domain} wants you to prove ownership of this wallet for BOARD.`,
    "",
    `Wallet: ${address}`,
    `Chain: ${getBoardChainLabel()} (${chainId})`,
    `Nonce: ${input.nonce}`,
    input.accountId ? `Link to account: ${input.accountId}` : "Purpose: Sign in to BOARD",
    "",
    input.accountId
      ? "Sign to authorize this wallet for the named BOARD account. Only sign if this is your account. This does not spend funds."
      : "Sign to log in with this wallet. This does not authorize linking to another account or spending funds.",
  ].join("\n");
}
