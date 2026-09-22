import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";

import {
  PLAY_ENTRY_FEE,
  PLAY_ENTRY_FEE_ETH,
  PLAY_STAKE_SYMBOL,
} from "@/lib/game/play-player";
import { getBoardChainEnv, getBoardChainId } from "@/lib/wallet/chains";

export { PLAY_ENTRY_FEE };

const ENTRY_FEE_WEI = parseEther(PLAY_ENTRY_FEE_ETH);

/**
 * Native ETH balance on Robinhood Chain for the connected wallet.
 */
export function useBoardTokenBalance() {
  const { address, isConnected, chainId } = useAccount();
  const expectedChainId = getBoardChainId();
  const onNetwork = isConnected && chainId === expectedChainId;
  const enabled = Boolean(onNetwork && address);

  const { data, isLoading, isFetching, refetch, error } = useBalance({
    address,
    chainId: expectedChainId,
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  });

  const amount = data ? Number(formatEther(data.value)) : null;

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
    error: error ? (error instanceof Error ? error.message : "Balance error") : null,
    canEnter: Boolean(onNetwork && data && data.value >= ENTRY_FEE_WEI),
    shortfall:
      data && data.value < ENTRY_FEE_WEI
        ? Number(formatEther(ENTRY_FEE_WEI - data.value))
        : 0,
    refetch,
  };
}
