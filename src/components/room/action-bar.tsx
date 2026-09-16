"use client";

import { Dices, Landmark, SkipForward } from "lucide-react";

import { DiceTray } from "@/components/room/dice-tray";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelPanel } from "@/components/ui/pixel-panel";
import type { DieValue } from "@/lib/game/dice";
import { cn } from "@/lib/utils";

/**
 * Turn controls plus the dice tray. Purchase handling lands with the next
 * task; for now only rolling and ending a turn are wired up.
 */
export function ActionBar({
  yourTurn,
  rolling,
  moving = false,
  dice,
  canBuy,
  onRoll,
  onBuy,
  onEndTurn,
  className,
}: {
  yourTurn: boolean;
  rolling: boolean;
  /** True while the active pawn is hopping tile-to-tile. */
  moving?: boolean;
  dice: readonly [DieValue, DieValue] | null;
  /** True while an affordable, unowned country is awaiting your decision. */
  canBuy: boolean;
  onRoll: () => void;
  onBuy: () => void;
  onEndTurn: () => void;
  className?: string;
}) {
  const busy = rolling || moving;

  return (
    <PixelPanel
      tone="raised"
      className={cn("flex flex-wrap items-center gap-4 p-4", className)}
    >
      <DiceTray values={dice} rolling={rolling} />

      <p className="font-pixel text-xs uppercase text-muted">
        {moving ? (
          <span className="text-gold animate-blink">Moving</span>
        ) : yourTurn ? (
          <span className="text-gold">Your turn</span>
        ) : (
          "Waiting for opponent"
        )}
      </p>

      <div className="ml-auto flex flex-wrap gap-2">
        <PixelButton
          variant="primary"
          size="md"
          disabled={!yourTurn || busy}
          onClick={onRoll}
        >
          <Dices className="size-4" aria-hidden />
          {rolling ? "Rolling" : moving ? "Moving" : "Roll dice"}
        </PixelButton>
        <PixelButton
          variant="secondary"
          size="md"
          disabled={!canBuy}
          onClick={onBuy}
        >
          <Landmark className="size-4" aria-hidden />
          Buy city
        </PixelButton>
        <PixelButton
          variant="outline"
          size="md"
          disabled={!yourTurn || busy}
          onClick={onEndTurn}
        >
          <SkipForward className="size-4" aria-hidden />
          End turn
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
