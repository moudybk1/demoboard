"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Trophy } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelButton, PixelButtonLink } from "@/components/ui/pixel-button";
import { PixelPanel } from "@/components/ui/pixel-panel";
import { PrizeSplit } from "@/components/wins/prize-split";
import { StartMatchButton } from "@/components/lobby/start-match-button";
import { ludoSeatColor } from "@/lib/game/ludo-board";
import { seatColor } from "@/lib/game/seats";
import { PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import type { GameType } from "@/lib/types";
import type { PlaySettlement } from "@/lib/game/live-match";
import { getBoardExplorerUrl } from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

export type WinnerSummary = {
  seat: number;
  username: string;
  isYou: boolean;
  /** Gross pot before the fee (entry fee × seats). */
  pot: number;
  /** Short line under the title · defaults to the Monopoly last-standing copy. */
  subtitle?: string;
};

/**
 * Full-board overlay when the room has a winner. Shows the prize split
 * (winner / development / buyback / burn) and a path back to the lobby.
 */
export function WinnerScreen({
  winner,
  game = "monopoly",
  settlement,
  matchId,
  onSettle,
  settling,
}: {
  winner: WinnerSummary;
  game?: GameType;
  settlement: PlaySettlement | null;
  matchId: string;
  onSettle: () => void;
  settling: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const color =
    game === "ludo" ? ludoSeatColor(winner.seat) : seatColor(winner.seat);
  const fee = Number(settlement?.feeAmount ?? 0);
  const grossPot = Number(settlement?.grossPot ?? 0);
  const payout = settlement ? Number(settlement.netPayout) : null;
  const feePercent = grossPot ? (fee / grossPot) * 100 : 0;
  const confirmed = settlement?.status === "confirmed";
  const statusText = confirmed
    ? "Payout confirmed"
    : settlement?.status === "submitted"
      ? "Awaiting transaction confirmation"
      : settlement?.status === "failed"
        ? "Payout not confirmed"
        : settlement?.status === "house"
          ? "House NPC won · no player payout"
          : "Settlement pending";
  const subtitle = winner.subtitle ?? "Last player standing takes the pot.";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const panel = node.querySelector<HTMLElement>("[data-winner-panel]");
    const bits = node.querySelectorAll<HTMLElement>("[data-confetti]");

    const intro = gsap.timeline();
    if (panel) {
      intro.fromTo(
        panel,
        { scale: 0.82, opacity: 0, y: 28 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(2)" },
      );
    }
    if (bits.length) {
      intro.fromTo(
        bits,
        { y: 0, opacity: 1, scale: 0.4 },
        {
          y: (i) => -40 - (i % 5) * 12,
          x: (i) => (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 10),
          opacity: 0,
          scale: 1,
          rotate: (i) => (i % 2 === 0 ? 120 : -120),
          duration: 1.1,
          stagger: 0.04,
          ease: "power2.out",
        },
        0.15,
      );
    }

    return () => {
      intro.kill();
    };
  }, [winner.seat]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-void/85 p-4">
      <div ref={ref} className="relative w-full max-w-sm">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            data-confetti
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 size-2 border border-void/40"
            style={{
              backgroundColor:
                index % 3 === 0
                  ? color.hex
                  : index % 3 === 1
                    ? "#f5c451"
                    : "#e8ecf8",
            }}
          />
        ))}
        <PixelPanel
          data-winner-panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
          tone="gold"
          className="overflow-hidden"
        >
          <div
            className={cn(
              "flex flex-col items-center gap-3 border-b-2 border-gold/40 px-5 py-6",
              "bg" in color ? color.bg : undefined,
            )}
            style={{ backgroundColor: `${color.hex}22` }}
          >
            <span
              aria-hidden
              className={cn(
                "pixel-corners grid size-14 place-items-center border-2 bg-gold text-void shadow-pixel-gold",
                "animate-float",
              )}
            >
              <Trophy className="size-7" />
            </span>

            <p className="font-pixel text-xs uppercase tracking-widest text-gold">
              Winner
            </p>
            <h2
              id="winner-title"
              className={cn(
                "font-pixel text-xl font-bold text-shadow-pixel sm:text-2xl",
                "text" in color ? color.text : undefined,
              )}
              style={"text" in color ? undefined : { color: color.hex }}
            >
              {winner.isYou ? "You win!" : `${winner.username} wins!`}
            </h2>
            <p className="text-center text-xs text-muted">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-faint">
                {statusText}
              </p>
              {payout !== null && (
                <BoardAmount
                  value={payout}
                  size="xl"
                  tone="gold"
                  ticker={PLAY_STAKE_SYMBOL}
                  className="mt-2 justify-center"
                />
              )}
              {!confirmed && settlement?.status !== "house" && (
                <p className="mt-2 text-xs text-muted">
                  This amount has not been confirmed as paid.
                </p>
              )}
              {settlement?.error && (
                <p role="alert" className="mt-2 text-xs text-gold">
                  {settlement.error}
                </p>
              )}
              {settlement?.txHash && (
                <a
                  className="mt-2 block text-xs text-gold underline"
                  href={`${getBoardExplorerUrl()}/tx/${settlement.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View payout transaction
                </a>
              )}
              <p className="mt-2 break-all text-[10px] text-faint">
                Match {matchId}
              </p>
              {settlement?.confirmedAt && (
                <p className="mt-1 text-xs text-muted">
                  Confirmed {new Date(settlement.confirmedAt).toLocaleString()}
                </p>
              )}
            </div>

            {settlement && (
              <PrizeSplit
                allocationsOnly
                retainedFeeOnly
                compact
                ticker={PLAY_STAKE_SYMBOL}
                className="border-t-2 border-edge pt-4"
                values={{
                  grossPot,
                  feePercent,
                  treasuryAmount: fee,
                  buybackAmount: 0,
                  burnAmount: 0,
                  netPayout: payout ?? 0,
                }}
              />
            )}
            <p className="text-center text-[10px] text-faint">
              Prize funded by verified entries. The full fee remains in the treasury;
              no automatic buyback or burn is performed.
            </p>
            {!confirmed && settlement?.status !== "house" && (
              <PixelButton disabled={settling} onClick={onSettle}>
                {settling
                  ? "Checking settlement…"
                  : settlement?.status === "submitted"
                    ? "Check confirmation"
                    : "Retry settlement"}
              </PixelButton>
            )}

            <StartMatchButton
              game={game}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Play again
            </StartMatchButton>
            <PixelButtonLink
              href="/play"
              variant="secondary"
              size="md"
              className="w-full"
            >
              Choose game
            </PixelButtonLink>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
