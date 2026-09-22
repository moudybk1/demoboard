import { Flag } from "lucide-react";

import {
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui/pixel-panel";
import { ludoSeatColor } from "@/lib/game/ludo-board";
import { pawnsFinished, type LudoPlayer } from "@/lib/mock/ludo";
import { cn } from "@/lib/utils";

/**
 * Race-to-four scoreboard. Each seat shows how many pawns have reached the
 * centre finish · the first to fill all four slots wins the room.
 */
export function FinishCountPanel({
  players,
  className,
}: {
  players: LudoPlayer[];
  className?: string;
}) {
  const ordered = [...players].sort((a, b) => a.position - b.position);
  const leader = Math.max(...ordered.map((player) => pawnsFinished(player)), 0);

  return (
    <PixelPanel className={cn("flex flex-col", className)}>
      <PixelPanelHeader>
        <PixelPanelTitle>Finish line</PixelPanelTitle>
        <span className="flex items-center gap-1 font-pixel text-xs uppercase text-faint">
          <Flag className="size-3" aria-hidden />
          First to 4
        </span>
      </PixelPanelHeader>

      <ul className="flex list-none flex-col gap-3 p-3">
        {ordered.map((player) => {
          const finished = pawnsFinished(player);
          const color = ludoSeatColor(player.position);
          const isLeader = finished > 0 && finished === leader;

          return (
            <li key={player.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <i
                    aria-hidden
                    className="size-2.5 shrink-0 border border-void/40"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span
                    className="truncate font-pixel text-xs"
                    style={{ color: color.hex }}
                  >
                    {player.username}
                    {player.isYou ? " (you)" : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "font-sans text-xs font-bold tabular-nums tracking-tight",
                    isLeader ? "text-gold" : "text-muted",
                  )}
                >
                  {finished}/4
                </span>
              </div>

              <div
                className="grid grid-cols-4 gap-1"
                role="img"
                aria-label={`${finished} of 4 pawns finished`}
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-2 border-2",
                      index < finished
                        ? "border-void/40"
                        : "border-edge bg-transparent",
                    )}
                    style={
                      index < finished
                        ? { backgroundColor: color.hex }
                        : undefined
                    }
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </PixelPanel>
  );
}
