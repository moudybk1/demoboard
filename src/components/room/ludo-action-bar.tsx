"use client";

import { Dices, SkipForward } from "lucide-react";

import { DieTray } from "@/components/room/dice-tray";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelPanel } from "@/components/ui/pixel-panel";
import type { DieValue } from "@/lib/game/dice";
import { cn } from "@/lib/utils";

/**
 * Turn controls for Ludo · single die with tumble animation. Buttons go
 * full-width under the die on narrow screens.
 */
export function LudoActionBar({
  yourTurn,
  rolling,
  canRoll = true,
  canEndTurn = true,
  value,
  secondsLeft = null,
  onRoll,
  onEndTurn,
  className,
}: {
  yourTurn: boolean;
  rolling: boolean;
  /** False while a roll must still be spent on a move. */
  canRoll?: boolean;
  canEndTurn?: boolean;
  value: DieValue | null;
  secondsLeft?: number | null;
  onRoll: () => void;
  onEndTurn: () => void;
  className?: string;
}) {
  const turnLabel =
    yourTurn && secondsLeft != null
      ? `Your turn · ${secondsLeft}s`
      : yourTurn
        ? "Your turn"
        : "Waiting";
  return (
    <PixelPanel
      tone="raised"
      className={cn(
        "flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <DieTray value={value} rolling={rolling} />
        <p className="font-pixel text-xs uppercase text-muted sm:hidden">
          {yourTurn ? (
            <span className="text-gold">{turnLabel}</span>
          ) : (
            "Waiting"
          )}
        </p>
      </div>

      <p className="hidden font-pixel text-xs uppercase text-muted sm:block">
        {yourTurn ? (
          <span className="text-gold">{turnLabel}</span>
        ) : (
          "Waiting for opponent"
        )}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap">
        <PixelButton
          variant="ludo"
          size="md"
          className="w-full sm:w-auto"
          disabled={!yourTurn || rolling || !canRoll}
          onClick={onRoll}
        >
          <Dices className="size-4" aria-hidden />
          {rolling ? "Rolling" : secondsLeft != null ? `Roll ${secondsLeft}s` : "Roll die"}
        </PixelButton>
        <PixelButton
          variant="outline"
          size="md"
          className="w-full sm:w-auto"
          disabled={!yourTurn || rolling || !canEndTurn}
          onClick={onEndTurn}
        >
          <SkipForward className="size-4" aria-hidden />
          End turn
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
