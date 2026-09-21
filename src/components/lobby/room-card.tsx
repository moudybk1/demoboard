import { Coins, Trophy, Users } from "lucide-react";

import { SeatDots } from "@/components/lobby/seat-dots";
import { StartMatchButton } from "@/components/lobby/start-match-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelBadge } from "@/components/ui/pixel-badge";
import { BoardAmount } from "@/components/ui/board-amount";
import { netPrize, type Room } from "@/lib/types";
import { cn, formatAge } from "@/lib/utils";

const STATUS_LABEL: Record<Room["status"], string> = {
  waiting: "Open",
  playing: "In play",
  finished: "Finished",
};

export function RoomCard({
  room,
  now,
}: {
  room: Room;
  balance: number;
  now: number;
}) {
  const open = room.status === "waiting";
  const accentBar = room.gameType === "monopoly" ? "bg-monopoly" : "bg-ludo";

  return (
    <PixelCard
      as="article"
      size="lg"
      tone="raised"
      className={cn(
        "h-full transition-transform duration-[var(--duration-fast)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        open && "hover:-translate-y-1",
        !open && "opacity-70",
      )}
      faceClassName="flex h-full flex-col overflow-hidden"
    >
      <div
        aria-hidden
        className={cn("h-1 w-full", accentBar, !open && "opacity-30")}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-pixel text-xs font-semibold text-parchment">
              {room.gameType === "monopoly" ? "Monopoly table" : "Ludo table"}
            </p>
            <p className="mt-1 text-xs text-faint">
              Four seats · opened {formatAge(room.createdAt, now)}
            </p>
          </div>
          <PixelBadge tone={open ? "success" : "neutral"}>
            {STATUS_LABEL[room.status]}
          </PixelBadge>
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
          <PixelCard size="sm" tone="cream" faceClassName="px-2.5 py-2.5">
            <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-faint">
              <Coins className="size-3" aria-hidden />
              Entry
            </dt>
            <dd className="mt-1.5">
              <BoardAmount value={room.entryFee} showTicker={false} />
            </dd>
          </PixelCard>
          <PixelCard size="sm" tone="gold" faceClassName="px-2.5 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-void">
              <Trophy className="size-3" aria-hidden />
              Winner pot
            </dt>
            <dd className="mt-1.5">
              <BoardAmount value={netPrize(room)} tone="gold" showTicker={false} />
            </dd>
          </PixelCard>
        </dl>

        <p className="font-pixel text-xs font-semibold uppercase leading-relaxed text-faint">
          You plus three rivals. Last player standing wins.
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t-[3px] border-void/15 pt-3">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-faint" aria-hidden />
            <SeatDots filled={1} total={room.maxPlayers} />
            <span className="text-[10px] text-faint">4 seats</span>
          </div>

          {open ? (
            <StartMatchButton game={room.gameType} size="sm">
              Play
            </StartMatchButton>
          ) : (
            <span className="font-pixel text-xs font-semibold uppercase text-faint">
              Locked
            </span>
          )}
        </div>
      </div>
    </PixelCard>
  );
}
