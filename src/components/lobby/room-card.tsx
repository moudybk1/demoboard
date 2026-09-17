import { Coins, Trophy, TriangleAlert, Users } from "lucide-react";

import { SeatDots } from "@/components/lobby/seat-dots";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelBadge } from "@/components/ui/pixel-badge";
import { PixelButton, PixelButtonLink } from "@/components/ui/pixel-button";
import { BoardAmount } from "@/components/ui/board-amount";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { netPrize, seatsLeft, type Room } from "@/lib/types";
import { cn, formatAge } from "@/lib/utils";

const STATUS_LABEL: Record<Room["status"], string> = {
  waiting: "Open seat",
  playing: "In play",
  finished: "Finished",
};

export function RoomCard({
  room,
  balance,
  now,
}: {
  room: Room;
  balance: number;
  now: number;
}) {
  const open = room.status === "waiting";
  const free = seatsLeft(room);
  const affordable = balance >= room.entryFee;
  const joinable = open && affordable;
  const shortfall = room.entryFee - balance;
  const shortfallId = `room-${room.id}-shortfall`;
  const accent = room.gameType === "monopoly" ? "monopoly" : "ludo";
  const accentBar =
    room.gameType === "monopoly" ? "bg-monopoly" : "bg-ludo";

  return (
    <PixelCard
      as="article"
      size="lg"
      tone="raised"
      stroke={open && !affordable ? "danger" : "void"}
      className={cn(
        "h-full transition-transform duration-[var(--duration-fast)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        joinable && "hover:-translate-y-1",
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
            <p className="font-pixel text-xs font-semibold text-parchment">{room.id}</p>
            <p className="mt-1 text-xs text-faint">
              Opened {formatAge(room.createdAt, now)}
            </p>
          </div>
          <PixelBadge tone={open ? "success" : "neutral"}>
            {open ? (
              <i
                className="size-1.5 bg-success animate-pulse-glow"
                aria-hidden
              />
            ) : null}
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
              <BoardAmount
                value={room.entryFee}
                tone={affordable ? "default" : "danger"}
                showTicker={false}
              />
            </dd>
          </PixelCard>
          <PixelCard size="sm" tone="gold" faceClassName="px-2.5 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-void">
              <Trophy className="size-3" aria-hidden />
              You win
            </dt>
            <dd className="mt-1.5">
              <BoardAmount
                value={netPrize(room)}
                tone="gold"
                showTicker={false}
              />
            </dd>
          </PixelCard>
        </dl>

        <p className="font-pixel text-xs font-semibold uppercase leading-relaxed text-faint">
          Pot {room.entryFee * room.maxPlayers} · winner keeps 98%
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t-[3px] border-void/15 pt-3">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-faint" aria-hidden />
            <SeatDots filled={room.players.length} total={room.maxPlayers} />
            <span className="text-[10px] text-faint">
              {room.players.length}/{room.maxPlayers}
            </span>
          </div>

          {!PLAY_IS_LIVE && open ? (
            <PixelButton variant={accent} size="sm" disabled>
              Coming soon
            </PixelButton>
          ) : null}

          {PLAY_IS_LIVE && joinable ? (
            <PixelButtonLink
              href={`/room/${room.id}`}
              variant={accent}
              size="sm"
            >
              Sit down
            </PixelButtonLink>
          ) : null}

          {PLAY_IS_LIVE && open && !affordable ? (
            <PixelButton
              variant={accent}
              size="sm"
              disabled
              aria-describedby={shortfallId}
            >
              Sit down
            </PixelButton>
          ) : null}

          {!open ? (
            <span className="font-pixel text-xs font-semibold uppercase text-faint">
              Locked
            </span>
          ) : null}
        </div>

        {PLAY_IS_LIVE && open && !affordable ? (
          <PixelCard
            id={shortfallId}
            role="status"
            size="sm"
            stroke="danger"
            faceClassName="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))] px-3 py-2"
          >
            <TriangleAlert
              className="size-3 shrink-0 text-danger"
              aria-hidden
            />
            <span className="text-[11px] text-danger">
              Need{" "}
              <BoardAmount
                value={shortfall}
                size="xs"
                tone="danger"
                showTicker={false}
              />{" "}
              more BOARD.
            </span>
          </PixelCard>
        ) : null}

        {PLAY_IS_LIVE && joinable && free > 0 ? (
          <p className="text-[10px] text-muted">
            Waiting for {free} more {free === 1 ? "player" : "players"}
          </p>
        ) : null}
      </div>
    </PixelCard>
  );
}
