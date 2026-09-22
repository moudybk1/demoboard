import { getAddress, parseUnits, type Hex } from "viem";

import { getBoardChainEnv } from "@/lib/wallet/chains";

/**
 * Canonical Global Dollar on Robinhood Chain mainnet (6 decimals).
 * Other contracts that reuse the USDG ticker are not this asset.
 * https://docs.robinhood.com/chain/contracts/
 */
export const USDG_MAINNET_ADDRESS =
  "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as Hex;

export const USDG_DECIMALS = 6;

/** Active USDG contract. Testnet must set NEXT_PUBLIC_USDG_ADDRESS. */
export function getUsdgAddress(): Hex | null {
  const override = process.env.NEXT_PUBLIC_USDG_ADDRESS?.trim();
  if (override && /^0x[a-fA-F0-9]{40}$/.test(override)) {
    return getAddress(override);
  }
  if (getBoardChainEnv() === "mainnet") return getAddress(USDG_MAINNET_ADDRESS);
  return null;
}

export function usdgUnits(amount: string): bigint {
  return parseUnits(amount, USDG_DECIMALS);
}
