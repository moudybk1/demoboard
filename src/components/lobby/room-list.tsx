"use client";

import { useMemo } from "react";
import { Coins, Radio, SearchX, Swords } from "lucide-react";

import { RoomCard } from "@/components/lobby/room-card";
import { StartMatchButton } from "@/components/lobby/start-match-button";
import { BoardAmount } from "@/components/ui/board-amount";
import { PixelBadge } from "@/components/ui/pixel-badge";
import { PixelPanel } from "@/components/ui/pixel-panel";
import { getGameOption } from "@/lib/mock/lobby";
import { prizePool, seatsLeft, type GameType, type Room } from "@/lib/types";

/**
 * Rooms closest to starting come first · a table needing one more player is
 * the most useful thing to show. Cheaper entry fees break ties so the list
 * stays approachable at the top.
 */
function byUrgency(a: Room, b: Room) {
  return seatsLeft(a) - seatsLeft(b) || a.entryFee - b.entryFee;
}

export function RoomList({
  gameType,
  rooms,
  balance,
  now,
  /** Rendered next to the heading · the entry-fee filter slots in here. */
  toolbar,
  /** Shown in the empty state when the filter, not the lobby, is the reason. */
  filtered = false,
}: {
  gameType: GameType;
  rooms: Room[];
  balance: number;
  /** Reference timestamp for room age labels. */
  now: number;
  toolbar?: React.ReactNode;
  filtered?: boolean;
}) {
  const game = getGameOption(gameType);

  const { open, live } = useMemo(() => {
    return {
      open: rooms
        .filter((room) => room.status === "waiting")
        .sort(byUrgency),
      live: rooms
        .filter((room) => room.status === "playing")
        .sort((a, b) => b.entryFee - a.entryFee),
    };
  }, [rooms]);

  const biggestPot = open.length
    ? Math.max(...open.map((room) => prizePool(room)))
    : 0;

  return (
    <section aria-labelledby={`rooms-${gameType}`} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id={`rooms-${gameType}`}
          className="font-pixel text-[11px] uppercase text-parchment text-shadow-pixel"
        >
          {game.name} rooms
        </h2>

        <PixelBadge tone="success">
          <Radio className="size-3" aria-hidden />
          {open.length} open
        </PixelBadge>

        {live.length > 0 && (
          <PixelBadge tone="neutral">
            <Swords className="size-3" aria-hidden />
            {live.length} in progress
          </PixelBadge>
        )}

        {biggestPot > 0 && (
          <PixelBadge tone="gold">
            <Coins className="size-3" aria-hidden />
            Up to
            <BoardAmount value={biggestPot} size="xs" tone="gold" />
          </PixelBadge>
        )}

        {/* On narrow screens the filter needs its own row; on wide ones it
            sits opposite the heading. */}
        {toolbar && <div className="w-full 2xl:ml-auto 2xl:w-auto">{toolbar}</div>}
      </div>

      {open.length === 0 ? (
        <RoomListEmpty
          gameName={game.name}
          gameType={gameType}
          filtered={filtered}
        />
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {open.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} balance={balance} now={now} />
            </li>
          ))}
        </ul>
      )}

      {live.length > 0 && (
        <div className="space-y-4 border-t-2 border-edge pt-6">
          <h3 className="font-pixel text-[10px] uppercase text-faint">
            Already playing
          </h3>
          <ul className="grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {live.map((room) => (
              <li key={room.id}>
                <RoomCard room={room} balance={balance} now={now} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RoomListEmpty({
  gameName,
  gameType,
  filtered,
}: {
  gameName: string;
  gameType: GameType;
  filtered: boolean;
}) {
  return (
    <PixelPanel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <SearchX className="size-8 text-faint" aria-hidden />
      <p className="font-pixel text-[10px] uppercase text-muted">
        {filtered ? "No rooms match" : "No open rooms"}
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-faint">
        {filtered
          ? "Try a different entry fee · there are other tables waiting."
          : `Start a ${gameName} match now. You plus three rivals.`}
      </p>
      {!filtered ? (
        <StartMatchButton game={gameType} size="md">
          Play {gameName}
        </StartMatchButton>
      ) : null}
    </PixelPanel>
  );
}
