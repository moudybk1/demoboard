"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { usePublicClient, useSendTransaction, useSwitchChain } from "wagmi";

import { useBoardTokenBalance } from "@/hooks/use-board-token-balance";
import { PLAY_ENTRY_FEE_ETH, savePlayPlayer } from "@/lib/game/play-player";
import { readPlaySeat, savePlaySeat } from "@/lib/game/play-table";
import { rememberPreviewGame, type PreviewGame } from "@/lib/preview-game";

export type SitPhase = "idle" | "sending" | "confirming" | "seating";

function sitErrorMessage(caught: unknown, refunded: boolean) {
  const raw =
    caught instanceof Error ? caught.message : "Could not sit at the table.";
  if (
    /user rejected|user denied|denied transaction|request rejected|rejected the request|action_rejected/i.test(
      raw,
    )
  ) {
    return "Sit cancelled in wallet.";
  }
  if (refunded) {
    return `${raw} Your 0.002 ETH is being returned.`;
  }
  return raw;
}

export function usePlaySit() {
  const router = useRouter();
  const wallet = useBoardTokenBalance();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [sitPhase, setSitPhase] = useState<SitPhase>("idle");
  const [sitTableId, setSitTableId] = useState<string | null>(null);
  const [sitError, setSitError] = useState<string | null>(null);

  async function sit(game: PreviewGame, tableId: string) {
    if (!wallet.address || sitPhase !== "idle") return;
    setSitError(null);

    const existing = readPlaySeat();
    if (existing && existing.address.toLowerCase() === wallet.address.toLowerCase()) {
      if (existing.tableId.toUpperCase() === tableId.toUpperCase()) {
        rememberPreviewGame(game);
        router.push(`/room/${existing.tableId}`);
        return;
      }
      setSitError("You already have a seat at another waiting table. Leave it first.");
      return;
    }

    if (!wallet.canEnter) return;
    setSitTableId(tableId);

    let refunded = false;
    try {
      setSitPhase("sending");
      const configResponse = await fetch("/api/play/config");
      const config = (await configResponse.json()) as {
        treasury?: `0x${string}`;
        error?: string;
      };
      if (!configResponse.ok || !config.treasury) {
        throw new Error(config.error ?? "Play treasury is not ready.");
      }

      const hash = await sendTransactionAsync({
        to: config.treasury,
        value: parseEther(PLAY_ENTRY_FEE_ETH),
        chainId: wallet.expectedChainId,
      });

      setSitPhase("confirming");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setSitPhase("seating");
      savePlayPlayer(wallet.address);
      const sitResponse = await fetch("/api/play/sit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          tableId,
          address: wallet.address,
          txHash: hash,
        }),
      });
      const payload = (await sitResponse.json()) as {
        table?: { id: string };
        seat?: number;
        leaveToken?: string;
        error?: string;
        refund?: boolean;
      };
      refunded = Boolean(payload.refund);
      if (
        !sitResponse.ok ||
        !payload.table ||
        !payload.leaveToken ||
        payload.seat == null
      ) {
        throw new Error(payload.error ?? "Could not sit at the table.");
      }

      savePlaySeat({
        tableId: payload.table.id,
        address: wallet.address,
        seat: payload.seat,
        leaveToken: payload.leaveToken,
      });
      rememberPreviewGame(game);
      void wallet.refetch();
      router.push(`/room/${payload.table.id}`);
    } catch (caught) {
      const message = sitErrorMessage(caught, refunded);
      setSitError(message);
      setSitPhase("idle");
      setSitTableId(null);
      void wallet.refetch();
    }
  }

  function switchNetwork() {
    void switchChainAsync({ chainId: wallet.expectedChainId });
  }

  return {
    wallet,
    sit,
    sitPhase,
    sitTableId,
    sitError,
    switching,
    switchNetwork,
  };
}

export type PlaySit = ReturnType<typeof usePlaySit>;
