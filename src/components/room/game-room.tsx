"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { LudoRoom } from "@/components/room/ludo-room";
import { MonopolyRoom } from "@/components/room/monopoly-room";
import { RoomHeader } from "@/components/room/room-header";
import { WaitingRoom } from "@/components/play/waiting-room";
import {
  loadLudoForTable,
  loadMonopolyForTable,
} from "@/lib/game/match-storage";
import { ludoPrizePool, type LudoRoomState } from "@/lib/mock/ludo";
import {
  monopolyPrizePool,
  type MonopolyRoomState,
} from "@/lib/mock/monopoly";
import type { PlayTableView } from "@/lib/game/play-table";

export function GameRoom({ roomId }: { roomId: string }) {
  const { address } = useAccount();
  const [table, setTable] = useState<PlayTableView | null>(null);
  const [missing, setMissing] = useState(false);
  const [ludo, setLudo] = useState<LudoRoomState | null>(null);
  const [mono, setMono] = useState<MonopolyRoomState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;

    async function load() {
      const response = await fetch(`/api/play/tables/${roomId}`, {
        cache: "no-store",
      });
      if (cancelled) return;
      if (response.status === 404) {
        setMissing(true);
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as { table: PlayTableView };
      setTable(payload.table);
      if (cancelled || source) return;
      source = new EventSource(`/api/play/tables/${roomId}/stream`);
      source.addEventListener("table", (event) => {
        try {
          const frame = JSON.parse(event.data) as { table?: PlayTableView };
          if (frame.table) setTable(frame.table);
        } catch {
          // ignore malformed frames
        }
      });
    }

    void load();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [roomId]);

  useEffect(() => {
    if (!table || table.status !== "playing") return;
    const viewer = address ?? null;
    if (table.game === "ludo") {
      setLudo(loadLudoForTable(table.id, table.seats, viewer));
    } else {
      setMono(loadMonopolyForTable(table.id, table.seats, viewer));
    }
  }, [address, table]);

  if (missing) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="font-pixel text-sm uppercase text-muted">
          Table not found. Sit from Play.
        </p>
      </main>
    );
  }

  if (!table) return <RoomLoading />;

  if (table.status === "waiting" || table.status === "cancelled") {
    return (
      <>
        <RoomHeader
          roomId={table.id}
          turn={0}
          turnSecondsLeft={0}
          pot={table.entryFee * table.maxPlayers}
          entryFee={table.entryFee}
          seats={table.maxPlayers}
          waiting
        />
        <WaitingRoom table={table} onTable={setTable} />
      </>
    );
  }

  if (table.game === "ludo") {
    if (!ludo) return <RoomLoading />;
    return (
      <>
        <RoomHeader
          roomId={ludo.roomId}
          turn={ludo.turn}
          turnSecondsLeft={ludo.turnSecondsLeft}
          pot={ludoPrizePool(ludo)}
          entryFee={ludo.entryFee}
          seats={ludo.maxPlayers}
        />
        <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-3 sm:px-6 sm:py-5">
          <LudoRoom initialState={ludo} />
        </main>
      </>
    );
  }

  if (!mono) return <RoomLoading />;
  return (
    <>
      <RoomHeader
        roomId={mono.roomId}
        turn={mono.turn}
        turnSecondsLeft={mono.turnSecondsLeft}
        pot={monopolyPrizePool(mono)}
        entryFee={mono.entryFee}
        seats={mono.maxPlayers}
      />
      <main className="mx-auto w-full max-w-[1920px] flex-1 px-2 py-2 sm:px-4 sm:py-3">
        <MonopolyRoom initialState={mono} />
      </main>
    </>
  );
}

function RoomLoading() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="font-pixel text-sm uppercase text-muted">Dealing the board…</p>
    </main>
  );
}
