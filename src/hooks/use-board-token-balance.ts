import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import {
  PLAY_ENTRY_AMOUNT,
  PLAY_ENTRY_FEE,
  PLAY_STAKE_SYMBOL,
} from "@/lib/game/play-player";
import { getBoardChainEnv, getBoardChainId } from "@/lib/wallet/chains";
import { getUsdgAddress, USDG_DECIMALS, usdgUnits } from "@/lib/wallet/usdg";

export { PLAY_ENTRY_FEE };

const ENTRY_UNITS = usdgUnits(PLAY_ENTRY_AMOUNT);

/**
 * USDG balance on Robinhood Chain for the connected wallet.
 * The entry transfer still spends a little native ETH as gas.
 */
export function useBoardTokenBalance() {
  const { address, isConnected, chainId } = useAccount();
  const expectedChainId = getBoardChainId();
  const onNetwork = isConnected && chainId === expectedChainId;
  const token = getUsdgAddress();
  const enabled = Boolean(onNetwork && address && token);

  const { data, isLoading, isFetching, refetch, error } = useReadContract({
    address: token ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: expectedChainId,
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  });

  const amount = data !== undefined ? Number(formatUnits(data, USDG_DECIMALS)) : null;

  return {
    address: address ?? null,
    isConnected,
    onNetwork,
    expectedChainId,
    chainEnv: getBoardChainEnv(),
    amount,
    symbol: PLAY_STAKE_SYMBOL,
    entryFee: PLAY_ENTRY_FEE,
    loading: enabled && (isLoading || isFetching) && amount === null,
    error: !token
      ? "USDG is not configured for this network."
      : error
        ? error instanceof Error
          ? error.message
          : "Balance error"
        : null,
    canEnter: Boolean(onNetwork && token && data !== undefined && data >= ENTRY_UNITS),
    shortfall:
      data !== undefined && data < ENTRY_UNITS
        ? Number(formatUnits(ENTRY_UNITS - data, USDG_DECIMALS))
        : 0,
    refetch,
  };
}
