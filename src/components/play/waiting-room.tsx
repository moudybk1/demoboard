"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PixelButton } from "@/components/ui/pixel-button";
import { BoardAmount } from "@/components/ui/board-amount";
import { PixelArt } from "@/components/game/pixel-art";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import {
  clearPlaySeat,
  readPlaySeat,
  type PlayTableView,
} from "@/lib/game/play-table";
import { PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import { shortenAddress } from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

export function WaitingRoom({
  table,
  onTable,
}: {
  table: PlayTableView;
  onTable: (next: PlayTableView) => void;
}) {
  const router = useRouter();
  const seatRecord = readPlaySeat();
  const mine = table.seats.find(
    (seat) =>
      seatRecord &&
      seat.address.toLowerCase() === seatRecord.address.toLowerCase(),
  );
  const [busy, setBusy] = useState<"ready" | "leave" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [treasury, setTreasury] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/play/config")
      .then((response) => response.json())
      .then((payload: { treasury?: string }) => {
        if (payload.treasury) setTreasury(payload.treasury);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const filled = table.seats.length;
  const readyCount = table.seats.filter((seat) => seat.ready).length;

  async function readyUp() {
    if (!seatRecord || busy) return;
    setBusy("ready");
    setError(null);
    try {
      const response = await fetch(`/api/play/tables/${table.id}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveToken: seatRecord.leaveToken }),
      });
      const payload = (await response.json()) as {
        table?: PlayTableView;
        error?: string;
      };
      if (!response.ok || !payload.table) {
        throw new Error(payload.error ?? "Could not ready up.");
      }
      onTable(payload.table);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not ready up.");
    } finally {
      setBusy(null);
    }
  }

  async function leaveTable() {
    if (!seatRecord || busy) return;
    setBusy("leave");
    setError(null);
    try {
      const response = await fetch(`/api/play/tables/${table.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveToken: seatRecord.leaveToken }),
      });
      const payload = (await response.json()) as {
        table?: PlayTableView;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not leave the table.");
      }
      clearPlaySeat();
      router.push("/play");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not leave.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full pixel-card-shadow-lg">
        <div className="pixel-notch border-[4px] border-void bg-[#5a2408] p-[4px]">
          <div className="pixel-notch bg-[#1a0c06] px-5 py-6">
            <p className="text-center font-pixel text-[10px] font-semibold uppercase tracking-wide text-gold">
              Waiting for players
            </p>
            <h1 className="mt-2 text-center font-pixel text-2xl font-bold uppercase text-cream">
              {filled}/{table.maxPlayers} seated
            </h1>
            <p className="mt-2 text-center font-pixel text-[10px] uppercase leading-relaxed text-cream/70">
              Sit fee{" "}
              <BoardAmount
                value={table.entryFee}
                size="xs"
                tone="gold"
                ticker={PLAY_STAKE_SYMBOL}
              />{" "}
              · {readyCount}/{table.maxPlayers} ready
            </p>

            <ol className="mt-5 grid grid-cols-2 gap-3">
              {Array.from({ length: table.maxPlayers }, (_, index) => {
                const seat = index + 1;
                const player = table.seats.find((row) => row.seat === seat);
                const isMine = Boolean(mine && mine.seat === seat);
                return (
                  <li
                    key={seat}
                    className={cn(
                      "flex items-center gap-2 border-[3px] border-void px-2 py-2",
                      player ? "bg-[#3a1a08]" : "bg-[#120805]",
                    )}
                  >
                    <span className="w-8 shrink-0">
                      <PixelArt sprite={pawnSprite(seat)} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-pixel text-[10px] uppercase text-gold">
                        Seat {seat}
                        {isMine ? " · you" : ""}
                      </p>
                      <p className="truncate font-pixel text-xs text-cream">
                        {player
                          ? shortenAddress(player.address)
                          : "Open"}
                      </p>
                      <p className="font-pixel text-[10px] uppercase text-cream/60">
                        {player ? (player.ready ? "Ready" : "Not ready") : "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {error ? (
              <p className="mt-4 text-center font-pixel text-[10px] uppercase leading-relaxed text-gold">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {mine && !mine.ready ? (
                <PixelButton
                  type="button"
                  size="lg"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={busy !== null}
                  onClick={() => void readyUp()}
                >
                  {busy === "ready" ? "Ready…" : "I'm ready"}
                </PixelButton>
              ) : (
                <p className="text-center font-pixel text-[10px] uppercase text-cream/70">
                  {mine?.ready
                    ? "You're ready. Waiting on the table."
                    : "Connect the wallet that sat this table."}
                </p>
              )}
              {mine ? (
                <PixelButton
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full justify-center"
                  disabled={busy !== null}
                  onClick={() => void leaveTable()}
                >
                  {busy === "leave" ? "Refunding…" : "Leave & refund"}
                </PixelButton>
              ) : null}
            </div>
            {treasury ? (
              <p className="mt-4 break-all text-center font-pixel text-[10px] uppercase leading-relaxed text-cream/50">
                House {shortenAddress(treasury)} · faucet it so refunds have gas
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
