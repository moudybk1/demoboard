import { Flag, Home } from "lucide-react";

import { PixelPanel } from "@/components/ui/pixel-panel";
import { ludoSeatColor } from "@/lib/game/ludo-board";
import { pawnsFinished, pawnsOnBoard, type LudoPlayer } from "@/lib/mock/ludo";
import { cn } from "@/lib/utils";

/** The four seats at a Ludo table, in seat order. */
export function LudoPlayerRail({
  players,
  activeSeat,
  className,
}: {
  players: LudoPlayer[];
  activeSeat: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        // Phone: swipeable row. Tablet: 2×2. Desktop: vertical rail.
        "flex list-none gap-2 overflow-x-auto pb-1",
        "sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0",
        "lg:flex lg:flex-col lg:gap-3",
        className,
      )}
    >
      {players.map((player) => (
        <li key={player.id} className="min-w-[11.5rem] shrink-0 sm:min-w-0">
          <LudoPlayerCard
            player={player}
            active={player.position === activeSeat}
          />
        </li>
      ))}
    </ul>
  );
}

function LudoPlayerCard({
  player,
  active,
}: {
  player: LudoPlayer;
  active: boolean;
}) {
  const color = ludoSeatColor(player.position);
  const done = player.status === "finished";
  const out = player.status === "eliminated";
  const finished = pawnsFinished(player);
  const activePawns = pawnsOnBoard(player);

  return (
    <PixelPanel
      tone="raised"
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-full flex-col gap-2 p-2.5 sm:gap-3 sm:p-3",
        "transition-colors",
        active && !done && !out && "bg-surface-hover",
        (done || out) && "opacity-70",
      )}
      style={
        active && !done && !out
          ? { boxShadow: `inset 0 0 0 2px ${color.hex}` }
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 shrink-0 border-2 border-void/40"
          style={{ backgroundColor: color.hex }}
        />
        <span
          className="truncate font-pixel text-xs sm:text-[10px]"
          style={{ color: color.hex }}
        >
          {player.username}
        </span>
        {player.isYou && (
          <span className="font-pixel text-xs uppercase text-faint">You</span>
        )}
        {out && (
          <span className="ml-auto font-pixel text-xs uppercase text-danger">
            Out
          </span>
        )}
        {active && !done && !out && (
          <span className="ml-auto font-pixel text-xs uppercase text-gold animate-blink">
            Turn
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-faint">
        <span className="flex items-center gap-1">
          <Home className="size-3" aria-hidden />
          {activePawns} out
        </span>
        <span className="flex items-center gap-1">
          <Flag className="size-3" aria-hidden />
          {finished}/4 home
        </span>
      </div>

      <div className="flex gap-1.5" aria-label="Pawn status">
        {player.pawns.map((pawn) => (
          <span
            key={pawn.id}
            title={`${pawn.status}${pawn.status === "track" || pawn.status === "home" ? ` · ${pawn.steps}` : ""}`}
            className={cn(
              "size-3 border-2",
              pawn.status === "yard" && "border-edge-bright bg-transparent",
              pawn.status === "track" && "border-void/40",
              pawn.status === "home" && "border-gold/60 opacity-80",
              pawn.status === "finished" &&
                "border-gold bg-gold shadow-[0_0_0_1px_var(--color-gold-deep)]",
            )}
            style={
              pawn.status === "track" || pawn.status === "home"
                ? { backgroundColor: color.hex }
                : undefined
            }
          />
        ))}
      </div>
    </PixelPanel>
  );
}
