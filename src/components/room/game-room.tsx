"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import { LudoRoom } from "@/components/room/ludo-room";
import { MonopolyRoom } from "@/components/room/monopoly-room";
import { LeaveMatchModal } from "@/components/room/leave-match-modal";
import { RoomHeader } from "@/components/room/room-header";
import { WaitingRoom } from "@/components/play/waiting-room";
import { forfeitPlayMatch } from "@/lib/game/forfeit-match";
import {
  MATCH_TURN_SECONDS,
  type TurnClockInfo,
} from "@/lib/game/match-clock";
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

const IDLE_CLOCK: TurnClockInfo = {
  seconds: MATCH_TURN_SECONDS,
  active: false,
  strikes: 0,
};

export function GameRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { address } = useAccount();
  const [table, setTable] = useState<PlayTableView | null>(null);
  const [missing, setMissing] = useState(false);
  const [ludo, setLudo] = useState<LudoRoomState | null>(null);
  const [mono, setMono] = useState<MonopolyRoomState | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [clock, setClock] = useState<TurnClockInfo>(IDLE_CLOCK);
  const leavingRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const exitMatch = useCallback(
    async (reason: "leave" | "afk") => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      await forfeitPlayMatch({
        tableId: roomId,
        address: address ?? undefined,
      });
      router.push(reason === "afk" ? "/play?forfeit=afk" : "/play?forfeit=1");
    },
    [address, roomId, router],
  );

  const handleAfkKick = useCallback(() => {
    void exitMatch("afk");
  }, [exitMatch]);

  const openLeave = useCallback(() => {
    if (leavingRef.current) return;
    setLeaveOpen(true);
  }, []);

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
    if (!ready || !table || !address) return;
    const seated = table.seats.some(
      (seat) => seat.address.toLowerCase() === address.toLowerCase(),
    );
    if (table.status === "playing" && !seated) {
      router.replace("/play");
    }
  }, [address, ready, router, table]);

  useEffect(() => {
    if (!table || table.status !== "playing") return;
    const viewer = address ?? null;
    if (
      viewer &&
      !table.seats.some((seat) => seat.address.toLowerCase() === viewer.toLowerCase())
    ) {
      return;
    }
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

  if (!ready || !table) return <RoomLoading />;

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

  const headerClock = {
    turnSecondsLeft: clock.seconds,
    clockActive: clock.active,
    afkStrikes: clock.strikes,
    onLeave: openLeave,
  };

  return (
    <>
      {table.game === "ludo" ? (
        ludo ? (
          <>
            <RoomHeader
              roomId={ludo.roomId}
              turn={ludo.turn}
              pot={ludoPrizePool(ludo)}
              entryFee={ludo.entryFee}
              seats={ludo.maxPlayers}
              {...headerClock}
            />
            <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-3 sm:px-6 sm:py-5">
              <LudoRoom
                initialState={ludo}
                onClock={setClock}
                onAfkKick={handleAfkKick}
                clockPaused={leaveOpen || leaving}
              />
            </main>
          </>
        ) : (
          <RoomLoading />
        )
      ) : mono ? (
        <>
          <RoomHeader
            roomId={mono.roomId}
            turn={mono.turn}
            pot={monopolyPrizePool(mono)}
            entryFee={mono.entryFee}
            seats={mono.maxPlayers}
            {...headerClock}
          />
          <main className="mx-auto w-full max-w-[1920px] flex-1 px-2 py-2 sm:px-4 sm:py-3">
            <MonopolyRoom
              initialState={mono}
              onClock={setClock}
              onAfkKick={handleAfkKick}
              clockPaused={leaveOpen || leaving}
            />
          </main>
        </>
      ) : (
        <RoomLoading />
      )}

      <LeaveMatchModal
        open={leaveOpen}
        busy={leaving}
        onStay={() => setLeaveOpen(false)}
        onLeave={() => void exitMatch("leave")}
      />
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
