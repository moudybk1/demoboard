"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Trophy } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { PixelPanel } from "@/components/ui/pixel-panel";
import { PrizeSplit } from "@/components/wins/prize-split";
import { seatColor } from "@/lib/game/seats";
import { PRIZE_FEE_RATE } from "@/lib/types";
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
export function WinnerScreen({ winner }: { winner: WinnerSummary }) {
  const ref = useRef<HTMLDivElement>(null);
  const color = seatColor(winner.seat);
  const fee = Math.round(winner.pot * PRIZE_FEE_RATE);
  // Matches economy.service feeDestination: 30% / 35% / 35%.
  const treasury = Math.round(fee * 0.3);
  const buyback = Math.round(fee * 0.35);
  const burn = fee - treasury - buyback;
  const payout = winner.pot - fee;
  const feePercent = Math.round(PRIZE_FEE_RATE * 100);
  const subtitle =
    winner.subtitle ?? "Last player standing takes the pot.";

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
          x: (i) => ((i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 10)),
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
              color.bg,
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
                color.text,
              )}
            >
              {winner.isYou ? "You win!" : `${winner.username} wins!`}
            </h2>
            <p className="text-center text-xs text-muted">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-faint">
                Payout
              </p>
              <BoardAmount
                value={payout}
                size="xl"
                tone="gold"
                className="mt-2 justify-center"
              />
            </div>

            <PrizeSplit
              compact
              className="border-t-2 border-edge pt-4"
              values={{
                grossPot: winner.pot,
                feePercent,
                treasuryAmount: treasury,
                buybackAmount: buyback,
                burnAmount: burn,
                netPayout: payout,
              }}
            />

            <PixelButtonLink
              href="/result"
              variant="primary"
              size="lg"
              className="w-full"
            >
              View full result
            </PixelButtonLink>
            <PixelButtonLink
              href="/lobby"
              variant="secondary"
              size="md"
              className="w-full"
            >
              Back to lobby
            </PixelButtonLink>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
