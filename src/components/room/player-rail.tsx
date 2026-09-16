import { Landmark } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { seatColor } from "@/lib/game/seats";
import type { MonopolyPlayer } from "@/lib/mock/monopoly";
import { cn } from "@/lib/utils";

/** Compact seat strip · keeps the board as the main focus. */
export function PlayerRail({
  players,
  activeSeat,
  className,
}: {
  players: MonopolyPlayer[];
  activeSeat: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex list-none gap-1 overflow-x-auto lg:flex-col lg:overflow-visible",
        className,
      )}
    >
      {players.map((player) => (
        <li key={player.id} className="min-w-[6.5rem] shrink-0 lg:min-w-0">
          <PlayerCard player={player} active={player.position === activeSeat} />
        </li>
      ))}
    </ul>
  );
}

function PlayerCard({
  player,
  active,
}: {
  player: MonopolyPlayer;
  active: boolean;
}) {
  const color = seatColor(player.position);
  const out = player.status === "eliminated";

  return (
    <div
      aria-current={active ? "true" : undefined}
      title={out ? "Out" : undefined}
      className={cn(
        "flex items-center gap-1 border border-edge bg-surface px-1 py-1",
        active && !out && cn(color.border, "border-2 bg-surface-hover"),
        out && "opacity-40",
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 border border-void/40", color.bg)}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-pixel text-[10px] leading-tight",
            out ? "text-faint line-through" : color.text,
          )}
        >
          {player.isYou ? "You" : player.username}
          {active && !out ? " ·" : ""}
        </p>
        {!out && (
          <div className="mt-0.5 flex items-center justify-between gap-1">
            <BoardAmount
              value={player.cash}
              size="xs"
              tone="default"
              showTicker={false}
            />
            <span className="flex items-center gap-0.5 font-pixel text-[10px] text-faint">
              <Landmark className="size-2" aria-hidden />
              {player.owned}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
