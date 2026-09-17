"use client";

import { Check, Radio, Users } from "lucide-react";

import { PixelCard } from "@/components/ui/pixel-card";
import { PixelBadge } from "@/components/ui/pixel-badge";
import type { GameOption } from "@/lib/mock/lobby";
import { cn, formatBoard } from "@/lib/utils";

/**
 * Toy cabinet picker card. Selecting swaps the room list in place.
 */
export function GameCard({
  game,
  selected,
  tabbable,
  onSelect,
  onKeyDown,
  ref,
}: {
  game: GameOption;
  selected: boolean;
  tabbable: boolean;
  onSelect: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const isMonopoly = game.type === "monopoly";

  return (
    <PixelCard
      as="button"
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      size="lg"
      tone={
        selected ? (isMonopoly ? "monopoly" : "ludo") : "surface"
      }
      className={cn(
        "group w-full text-left transition-transform duration-[var(--duration-fast)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
        selected ? "-translate-y-1" : "opacity-90 hover:-translate-y-1 hover:opacity-100",
      )}
      faceClassName="flex min-h-[12.5rem] flex-col overflow-hidden"
    >
      <div
        aria-hidden
        className={cn(
          "h-2.5 w-full",
          isMonopoly ? "bg-monopoly" : "bg-ludo",
          !selected && "opacity-55",
        )}
      />

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <span
            aria-hidden
            className={cn(
              "grid size-14 shrink-0 place-items-center pixel-corners border-[3px] border-void text-2xl sm:size-16 sm:text-3xl",
              selected && "animate-float",
              isMonopoly
                ? "bg-monopoly/20 text-monopoly"
                : "bg-ludo/20 text-ludo",
            )}
          >
            {game.glyph}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-pixel text-pixel-fluid-md font-bold",
                  isMonopoly ? "text-monopoly" : "text-ludo",
                )}
              >
                {game.name}
              </h3>
              {selected ? (
                <PixelBadge tone="gold">
                  <Check className="size-3" aria-hidden />
                  Selected
                </PixelBadge>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {game.tagline}
            </p>
          </div>
        </div>

        <p className="hidden flex-1 text-sm leading-relaxed text-muted sm:block">
          {game.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t-[3px] border-void/15 pt-4 text-xs font-bold uppercase tracking-wide text-faint">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            {formatBoard(game.activePlayers)} playing
          </span>
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5 text-success" aria-hidden />
            {game.openRooms} open
          </span>
          <span
            className={cn(
              "ml-auto font-pixel text-xs font-semibold uppercase transition-colors",
              selected ? "text-gold-deep" : "text-faint group-hover:text-parchment",
            )}
          >
            {selected ? "Tables below" : "Select"}
          </span>
        </div>
      </div>
    </PixelCard>
  );
}
