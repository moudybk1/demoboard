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
import { readResponseJson } from "@/lib/fetch-json";
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
import {
  clearPlaySeat,
  readPlaySeat,
  readPlayTableSnapshot,
  savePlaySeat,
  savePlayTableSnapshot,
  type PlayTableView,
} from "@/lib/game/play-table";

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
  const [note, setNote] = useState<string | null>(null);
  const tableRef = useRef<PlayTableView | null>(null);

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

    function publish(next: PlayTableView) {
      const viewer = readPlaySeat()?.address.toLowerCase() ?? null;
      const prev = tableRef.current;
      const hadViewer = Boolean(
        viewer &&
          prev?.seats.some((seat) => seat.address.toLowerCase() === viewer),
      );
      const hasViewer = Boolean(
        viewer &&
          next.seats.some((seat) => seat.address.toLowerCase() === viewer),
      );
      const merged = hadViewer && !hasViewer ? prev! : next;
      tableRef.current = merged;
      setTable(merged);
    }

    async function load() {
      const snapFallback = readPlayTableSnapshot(roomId);
      try {
      const seat = readPlaySeat();
      const proof =
        seat && seat.tableId.toUpperCase() === roomId.toUpperCase() ? seat : null;
      const response = proof
        ? await fetch(`/api/play/tables/${roomId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              address: proof.address,
              txHash: proof.txHash,
              leaveToken: proof.leaveToken,
            }),
          })
        : await fetch(`/api/play/tables/${roomId}`, { cache: "no-store" });
      if (cancelled) return;
      const payload = (await readResponseJson(response)) as {
        table?: PlayTableView;
        note?: string | null;
        blocked?: boolean;
      } | null;
      if (payload?.blocked) {
        clearPlaySeat();
        if (payload.table) publish(payload.table);
        setNote(payload.note ?? "That sit payment can no longer open a seat.");
        setMissing(!payload.table);
        return;
      }
      const snapshot = readPlayTableSnapshot(roomId);
      const viewer = proof?.address.toLowerCase() ?? null;
      const serverHasViewer = Boolean(
        viewer &&
          payload?.table?.seats.some(
            (seat) => seat.address.toLowerCase() === viewer,
          ),
      );
      const snapHasViewer = Boolean(
        viewer &&
          snapshot?.seats.some((seat) => seat.address.toLowerCase() === viewer),
      );
      if (!payload?.table && !snapHasViewer) {
        setMissing(true);
        return;
      }
      const next = serverHasViewer || !snapHasViewer ? payload!.table! : snapshot!;
      if (serverHasViewer && payload?.table) savePlayTableSnapshot(payload.table);
      publish(next);
      setNote(serverHasViewer || snapHasViewer ? null : (payload?.note ?? null));
      if (cancelled || source) return;
      source = new EventSource(`/api/play/tables/${roomId}/stream`);
      source.addEventListener("table", (event) => {
        try {
          const frame = JSON.parse(event.data) as { table?: PlayTableView };
          if (frame.table) publish(frame.table);
        } catch {
          // ignore malformed frames
        }
      });
      } catch {
        if (cancelled) return;
        if (snapFallback) publish(snapFallback);
        else setMissing(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [roomId]);

  useEffect(() => {
    const seat = readPlaySeat();
    const snapshot = readPlayTableSnapshot(roomId);
    if (!seat?.txHash || !snapshot) return;
    if (seat.tableId.toUpperCase() !== roomId.toUpperCase()) return;
    let cancelled = false;

    async function confirm() {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (cancelled) return;
        try {
          const response = await fetch("/api/play/sit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              game: snapshot!.game,
              tableId: roomId,
              address: seat!.address,
              txHash: seat!.txHash,
            }),
          });
          const payload = (await readResponseJson(response)) as {
            table?: PlayTableView;
            seat?: number;
            leaveToken?: string;
            txHash?: string;
            code?: string;
            error?: string;
          } | null;
          if (
            response.ok &&
            payload?.table &&
            payload.leaveToken &&
            payload.seat != null
          ) {
            savePlaySeat({
              tableId: payload.table.id,
              address: seat!.address,
              seat: payload.seat,
              leaveToken: payload.leaveToken,
              txHash: payload.txHash ?? seat!.txHash,
            });
            savePlayTableSnapshot(payload.table);
            if (!cancelled) {
              tableRef.current = payload.table;
              setTable(payload.table);
              setNote(null);
            }
            return;
          }
          const retryable =
            !payload ||
            payload.code === "BAD_TX" ||
            /empty response|not found on Robinhood Chain yet/i.test(
              payload.error ?? "",
            );
          if (!retryable) return;
        } catch {
          // try again
        }
        await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
      }
    }

    void confirm();
    return () => {
      cancelled = true;
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
        <WaitingRoom
          table={table}
          note={note}
          onTable={(next) => {
            tableRef.current = next;
            setTable(next);
            savePlayTableSnapshot(next);
          }}
        />
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
