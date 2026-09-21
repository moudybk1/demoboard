import Link from "next/link";
import { Clock, LogOut } from "lucide-react";

import { BoardLogo } from "@/components/layout/board-logo";
import { PixelBadge } from "@/components/ui/pixel-badge";
import { RoomEconomyHighlight } from "@/components/ui/room-economy-highlight";
import { MATCH_AFK_STRIKES } from "@/lib/game/match-clock";
import { PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";

export function RoomHeader({
  roomId,
  turn,
  turnSecondsLeft,
  pot,
  entryFee,
  seats = 4,
  balance,
  waiting = false,
  clockActive = false,
  afkStrikes = 0,
  onLeave,
}: {
  roomId: string;
  turn: number;
  turnSecondsLeft: number;
  /** Prize pool before the fee is taken (kept for callers; derived from entry). */
  pot: number;
  entryFee: number;
  seats?: number;
  balance?: number;
  waiting?: boolean;
  /** True while this player must roll before the clock expires. */
  clockActive?: boolean;
  afkStrikes?: number;
  /** Live match: confirm before leaving. Waiting rooms keep the Play link. */
  onLeave?: () => void;
}) {
  void pot;

  return (
    <header className="border-b-[3px] border-void bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        {onLeave ? (
          <button
            type="button"
            aria-label="Leave match"
            className="shrink-0"
            onClick={onLeave}
          >
            <BoardLogo />
          </button>
        ) : (
          <Link href="/play" aria-label="Back to play" className="shrink-0">
            <BoardLogo />
          </Link>
        )}

        <span className="pixel-corners border-[3px] border-void bg-cream px-2.5 py-1 font-pixel text-xs font-semibold text-parchment sm:px-3 sm:py-1.5 sm:text-[10px]">
          {roomId}
        </span>

        {!waiting ? (
          <>
            <PixelBadge tone="neutral" className="hidden sm:inline-flex">
              Turn {turn}
            </PixelBadge>

            {clockActive ? (
              <PixelBadge tone={turnSecondsLeft <= 5 ? "danger" : "gold"}>
                <Clock className="size-3" aria-hidden />
                {turnSecondsLeft}s to roll
              </PixelBadge>
            ) : (
              <PixelBadge tone="neutral">
                <Clock className="size-3" aria-hidden />
                Wait
              </PixelBadge>
            )}

            {afkStrikes > 0 ? (
              <PixelBadge tone="danger">
                {afkStrikes}/{MATCH_AFK_STRIKES} missed
              </PixelBadge>
            ) : null}
          </>
        ) : (
          <PixelBadge tone="neutral">Waiting</PixelBadge>
        )}

        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto">
          <RoomEconomyHighlight
            entryFee={entryFee}
            seats={seats}
            balance={balance}
            ticker={PLAY_STAKE_SYMBOL}
            variant="strip"
          />
        </div>

        {onLeave ? (
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 pixel-corners border-[3px] border-void bg-cream px-2.5 py-1 font-pixel text-xs font-semibold uppercase leading-none text-muted transition-colors hover:bg-danger hover:text-cream sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[10px]"
          >
            <LogOut className="size-3" aria-hidden />
            <span className="hidden sm:inline">Leave</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
