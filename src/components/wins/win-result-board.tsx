"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Trophy } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import {
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui/pixel-panel";
import { PrizeSplit } from "@/components/wins/prize-split";
import { PayoutStatusBanner } from "@/components/wins/payout-status-badge";
import { seatColor } from "@/lib/game/seats";
import type { MockWinResult } from "@/lib/mock/wins";
import { cn, formatAge } from "@/lib/utils";

/**
 * Full-page win result board (mock). Used by /result; room overlay stays separate.
 */
export function WinResultBoard({
  result,
  now = Date.parse("2026-09-13T12:00:00.000Z"),
}: {
  result: MockWinResult;
  now?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const color = seatColor(result.winner.seat);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parts = node.querySelectorAll<HTMLElement>("[data-win-in]");
    const tween = gsap.fromTo(
      parts,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "transform",
      },
    );
    return () => {
      tween.kill();
    };
  }, [result.id]);

  return (
    <div ref={root} className="mx-auto w-full max-w-lg space-y-6">
      <header data-win-in className="text-center">
        <p className="font-pixel text-xs uppercase tracking-widest text-gold">
          Match settled
        </p>
        <h1 className="mt-3 font-pixel text-lg font-bold text-parchment text-shadow-pixel sm:text-xl">
          {result.winner.isYou ? "You win!" : `${result.winner.username} wins!`}
        </h1>
        <p className="mt-3 text-sm text-muted">{result.subtitle}</p>
        <p className="mt-2 font-pixel text-xs uppercase text-faint">
          {result.gameType} · {formatAge(result.settledAt, now)}
        </p>
      </header>

      <div data-win-in>
        <PayoutStatusBanner status={result.payoutStatus} />
      </div>

      <div data-win-in>
        <PixelPanel tone="gold" className="overflow-hidden">
          <div
            className="flex flex-col items-center gap-3 border-b-2 border-gold/40 px-5 py-8"
            style={{ backgroundColor: `${color.hex}22` }}
          >
            <span
              aria-hidden
              className="pixel-corners grid size-16 place-items-center border-2 border-gold-deep bg-gold text-void shadow-pixel-gold animate-float"
            >
              <Trophy className="size-8" />
            </span>
            <p className={cn("font-pixel text-sm font-bold", color.text)}>
              Seat {result.winner.seat} · {result.winner.username}
            </p>
            <div className="text-center">
              <p className="font-pixel text-xs uppercase text-faint">
                Net payout
              </p>
              <BoardAmount
                value={result.netPayout}
                size="xl"
                tone="gold"
                className="mt-2 justify-center"
              />
            </div>
          </div>

          <div className="space-y-3 p-5">
            <PixelPanelHeader className="border-0 bg-transparent px-0 py-0">
              <PixelPanelTitle>Prize split</PixelPanelTitle>
            </PixelPanelHeader>

            <PrizeSplit
              values={{
                grossPot: result.grossPot,
                feePercent: result.feePercent,
                treasuryAmount: result.treasuryAmount,
                buybackAmount: result.buybackAmount,
                burnAmount: result.burnAmount,
                netPayout: result.netPayout,
              }}
            />

            <p className="pt-2 text-xs leading-relaxed text-faint">
              Entry {result.entryFee.toLocaleString("en-US")} BOARD ×{" "}
              {result.seats} seats. Room {result.roomId}.
            </p>
          </div>
        </PixelPanel>
      </div>

      <div data-win-in className="flex flex-col gap-3 sm:flex-row">
        <PixelButtonLink href="/lobby" size="lg" className="w-full sm:flex-1">
          Back to lobby
        </PixelButtonLink>
        <PixelButtonLink
          href="/"
          variant="secondary"
          size="lg"
          className="w-full sm:flex-1"
        >
          Home
        </PixelButtonLink>
      </div>
    </div>
  );
}
