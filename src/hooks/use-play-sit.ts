"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther, stringToHex } from "viem";
import { usePublicClient, useSendTransaction, useSwitchChain } from "wagmi";

import { useBoardTokenBalance } from "@/hooks/use-board-token-balance";
import { readResponseJson } from "@/lib/fetch-json";
import { PLAY_ENTRY_FEE_ETH, savePlayPlayer } from "@/lib/game/play-player";
import {
  buildLocalWaitingTable,
  clearPlaySeat,
  readPlaySeat,
  savePlaySeat,
  savePlayTableSnapshot,
  type PlayTableView,
} from "@/lib/game/play-table";
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
    const address = wallet.address;
    if (!address || sitPhase !== "idle") return;
    setSitError(null);

    const existing = readPlaySeat();
    if (existing && existing.address.toLowerCase() === address.toLowerCase()) {
      const sameTable = existing.tableId.toUpperCase() === tableId.toUpperCase();
      if (sameTable && existing.txHash) {
        rememberPreviewGame(game);
        router.push(`/room/${existing.tableId}`);
        return;
      }
      if (!sameTable) {
        clearPlaySeat();
      } else {
        let stillSeated = false;
        try {
          const live = await fetch(`/api/play/tables/${existing.tableId}`, {
            cache: "no-store",
          });
          const payload = (await readResponseJson(live)) as {
            table?: { seats?: Array<{ address: string }> };
          } | null;
          stillSeated = Boolean(
            live.ok &&
              payload?.table?.seats?.some(
                (row) => row.address.toLowerCase() === address.toLowerCase(),
              ),
          );
        } catch {
          stillSeated = false;
        }
        if (stillSeated) {
          rememberPreviewGame(game);
          router.push(`/room/${existing.tableId}`);
          return;
        }
        clearPlaySeat();
      }
    }

    if (!wallet.canEnter) return;
    setSitTableId(tableId);
    setSitPhase("seating");

    let refunded = false;
    try {
      const claimed = await requestSeat({ game, tableId, address });
      if (claimed.ok) {
        openRoom(claimed, game, address);
        return;
      }
      if (claimed.code !== "NO_PAYMENT") {
        refunded = claimed.refunded;
        throw new Error(claimed.error);
      }

      setSitPhase("sending");
      const configResponse = await fetch("/api/play/config");
      const config = (await readResponseJson(configResponse)) as {
        treasury?: `0x${string}`;
        error?: string;
      } | null;
      if (!configResponse.ok || !config?.treasury) {
        throw new Error(config?.error ?? "Play treasury is not ready.");
      }

      const hash = await sendTransactionAsync({
        to: config.treasury,
        value: parseEther(PLAY_ENTRY_FEE_ETH),
        data: stringToHex(tableId),
        chainId: wallet.expectedChainId,
      });

      setSitPhase("confirming");
      const localTable = buildLocalWaitingTable({ tableId, game, address });
      savePlayPlayer(address);
      savePlaySeat({
        tableId: localTable.id,
        address,
        seat: 1,
        leaveToken: hash,
        txHash: hash,
      });
      savePlayTableSnapshot(localTable);
      rememberPreviewGame(game);
      router.push(`/room/${localTable.id}`);

      if (publicClient) {
        void publicClient
          .waitForTransactionReceipt({
            hash,
            timeout: 20_000,
            confirmations: 1,
          })
          .catch(() => {
            // The room is already open. Server seating retries on its own.
          });
      }

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const seated = await requestSeat({ game, tableId, address, txHash: hash });
        if (seated.ok) {
          savePlayPlayer(address);
          savePlaySeat({
            tableId: seated.tableId,
            address,
            seat: seated.seat,
            leaveToken: seated.leaveToken,
            txHash: seated.txHash ?? hash,
          });
          if (seated.table) savePlayTableSnapshot(seated.table);
          return;
        }
        const retryable =
          seated.code === "BAD_TX" ||
          /empty response|not found on Robinhood Chain yet/i.test(seated.error);
        if (!retryable) return;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    } catch (caught) {
      const message = sitErrorMessage(caught, refunded);
      setSitError(message);
      setSitPhase("idle");
      setSitTableId(null);
      void wallet.refetch();
    }

    type SeatPayload =
      | {
          ok: true;
          tableId: string;
          seat: number;
          leaveToken: string;
          txHash?: string;
          table?: PlayTableView;
        }
      | {
          ok: false;
          code?: string;
          error: string;
          refunded: boolean;
        };

    async function requestSeat(body: {
      game: PreviewGame;
      tableId: string;
      address: `0x${string}`;
      txHash?: `0x${string}`;
    }): Promise<SeatPayload> {
      const response = await fetch("/api/play/sit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await readResponseJson(response)) as {
        table?: PlayTableView;
        seat?: number;
        leaveToken?: string;
        txHash?: string;
        error?: string;
        code?: string;
        refund?: boolean;
      } | null;
      if (!payload) {
        return {
          ok: false,
          code: "BAD_TX",
          error: "Seat request returned an empty response.",
          refunded: false,
        };
      }
      if (response.ok && payload.table && payload.leaveToken && payload.seat != null) {
        return {
          ok: true,
          tableId: payload.table.id,
          seat: payload.seat,
          leaveToken: payload.leaveToken,
          txHash: payload.txHash ?? body.txHash,
          table: payload.table,
        };
      }
      return {
        ok: false,
        code: payload.code,
        error: payload.error ?? "Could not sit at the table.",
        refunded: Boolean(payload.refund),
      };
    }

    function openRoom(
      seated: Extract<SeatPayload, { ok: true }>,
      game: PreviewGame,
      player: `0x${string}`,
    ) {
      savePlayPlayer(player);
      savePlaySeat({
        tableId: seated.tableId,
        address: player,
        seat: seated.seat,
        leaveToken: seated.leaveToken,
        txHash: seated.txHash,
      });
      if (seated.table) savePlayTableSnapshot(seated.table);
      rememberPreviewGame(game);
      void wallet.refetch();
      router.push(`/room/${seated.tableId}`);
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
