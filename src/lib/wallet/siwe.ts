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
    "",
    "Sign this message to link your wallet. This does not spend tokens.",
  ].join("\n");
}
