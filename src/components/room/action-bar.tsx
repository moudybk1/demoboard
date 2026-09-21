"use client";

import { Dices, Landmark, SkipForward } from "lucide-react";

import { DiceTray } from "@/components/room/dice-tray";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelPanel } from "@/components/ui/pixel-panel";
import type { DieValue } from "@/lib/game/dice";
import { cn } from "@/lib/utils";

/**
 * Turn controls plus the dice tray.
 */
export function ActionBar({
  yourTurn,
  rolling,
  moving = false,
  dice,
  canBuy,
  canPayJail = false,
  hasRolled = false,
  secondsLeft = null,
  onRoll,
  onBuy,
  onEndTurn,
  onPayJail,
  className,
}: {
  yourTurn: boolean;
  rolling: boolean;
  moving?: boolean;
  dice: readonly [DieValue, DieValue] | null;
  canBuy: boolean;
  canPayJail?: boolean;
  hasRolled?: boolean;
  secondsLeft?: number | null;
  onRoll: () => void;
  onBuy: () => void;
  onEndTurn: () => void;
  onPayJail?: () => void;
  className?: string;
}) {
  const busy = rolling || moving;
  const canRoll = yourTurn && !busy && !hasRolled;

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
          <span className="text-gold">
            Your turn
            {secondsLeft != null ? ` · ${secondsLeft}s` : ""}
          </span>
        ) : (
          "Waiting for opponent"
        )}
      </p>

      <div className="ml-auto flex flex-wrap gap-2">
        <PixelButton
          variant="primary"
          size="md"
          disabled={!canRoll}
          onClick={onRoll}
        >
          <Dices className="size-4" aria-hidden />
          {rolling ? "Rolling" : secondsLeft != null ? `Roll ${secondsLeft}s` : "Roll dice"}
        </PixelButton>
        {onPayJail ? (
          <PixelButton
            variant="secondary"
            size="md"
            disabled={!canPayJail || busy}
            onClick={onPayJail}
          >
            Pay jail
          </PixelButton>
        ) : null}
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
          disabled={!yourTurn || busy || !hasRolled}
          onClick={onEndTurn}
        >
          <SkipForward className="size-4" aria-hidden />
          End turn
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
