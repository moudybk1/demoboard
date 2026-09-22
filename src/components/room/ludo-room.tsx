"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityLog } from "@/components/room/activity-log";
import {
  CaptureBurst,
  type CaptureEvent,
} from "@/components/room/capture-burst";
import { FinishCountPanel } from "@/components/room/finish-count-panel";
import { LudoActionBar } from "@/components/room/ludo-action-bar";
import { LudoBoardStage } from "@/components/room/ludo-board-stage";
import { LudoPawnLayer } from "@/components/room/ludo-pawn-layer";
import { LudoPlayerRail } from "@/components/room/ludo-player-rail";
import { RoomTurnClock } from "@/components/room/room-turn-clock";
import { WinnerScreen } from "@/components/room/winner-screen";
import { randomDie, type DieValue } from "@/lib/game/dice";
import {
  captureReturnPath,
  cellCenter,
  pawnsForBoard,
} from "@/lib/game/ludo-geometry";
import { MATCH_TURN_SECONDS, type TurnClockInfo } from "@/lib/game/match-clock";
import {
  chooseNpcMove,
  findCaptures,
  grantsExtraTurn,
  movablePawns,
  nextActiveSeat,
  recordLudoAfkMiss,
  registerNonSixRoll,
  registerSixRoll,
  sendHome,
  type MovePreview,
} from "@/lib/game/ludo-rules";
import {
  playCaptureSound,
  playLoseSound,
  playWinSound,
} from "@/lib/game/sfx";
import {
  ludoPrizePool,
  pawnsFinished,
  type LudoLogEntry,
  type LudoPlayer,
  type LudoRoomState,
} from "@/lib/mock/ludo";
import { saveLudo } from "@/lib/game/match-storage";
import { isPlayBot } from "@/lib/game/play-table";

const ROLL_MS = 1300;
const NPC_THINK_MS = 650;

/**
 * Ludo room with standard rules: 6 to exit, exact home, captures, blockades,
 * extra rolls on 6 / capture / finish, three-sixes penalty, and NPC seats.
 */
export const LudoRoom = memo(function LudoRoom({
  initialState,
  onClock,
  onAfkKick,
  clockPaused = false,
}: {
  initialState: LudoRoomState;
  onClock?: (clock: TurnClockInfo) => void;
  onAfkKick?: () => void;
  clockPaused?: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [die, setDie] = useState<DieValue | null>(null);
  const [rolling, setRolling] = useState(false);
  const [moves, setMoves] = useState<MovePreview[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [movePath, setMovePath] = useState<[number, number][] | null>(null);
  const [capture, setCapture] = useState<CaptureEvent | null>(null);
  const [returnPaths, setReturnPaths] = useState<
    Record<string, [number, number][]>
  >({});
  /** True after a roll is consumed by a move (or voided); must end or bonus-roll. */
  const [rollSpent, setRollSpent] = useState(false);

  const pendingMove = useRef<MovePreview | null>(null);
  const consecutiveSixes = useRef(0);
  const timers = useRef<number[]>([]);
  const stateRef = useRef(state);
  const busyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    saveLudo(state);
  }, [state]);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  const players = useMemo(
    () => [...state.players].sort((a, b) => a.position - b.position),
    [state.players],
  );

  const pawns = useMemo(() => pawnsForBoard(players), [players]);

  const you = players.find((player) => player.isYou);
  const activePlayer = players.find(
    (player) => player.position === state.activeSeat,
  );
  const yourTurn = you?.position === state.activeSeat;
  const youOut = you?.status === "eliminated";
  const awaitingPick = moves.length > 0 && movingId === null;
  const canRoll =
    !rolling &&
    !awaitingPick &&
    !movingId &&
    !rollSpent &&
    state.lastRoll === null;

  const winner = useMemo(() => {
    const finisher = players.find(
      (player) =>
        player.status !== "eliminated" &&
        (player.status === "finished" || pawnsFinished(player) >= 4),
    );
    if (!finisher) return null;
    return {
      seat: finisher.position,
      username: finisher.username,
      isYou: finisher.isYou,
      pot: ludoPrizePool(state),
      subtitle: "First to finish all four pawns takes the pot.",
    };
  }, [players, state]);

  const finished = winner !== null;
  const rollWindow = Boolean(
    yourTurn && !finished && !youOut && canRoll && !clockPaused,
  );
  const youStrikes = you ? (state.afkStrikes?.[you.position] ?? 0) : 0;

  useEffect(() => {
    if (!finished || !winner) return;
    if (winner.isYou) playWinSound();
    else playLoseSound();
  }, [finished, winner]);

  const appendLog = useCallback((entry: Omit<LudoLogEntry, "id">) => {
    setState((current) => ({
      ...current,
      log: [
        { ...entry, id: `l-${current.log.length + 1}-${Date.now()}` },
        ...current.log,
      ],
    }));
  }, []);

  const advanceTurn = useCallback(
    (fromSeat: number, note?: string) => {
      const current = stateRef.current;
      const next = nextActiveSeat(current.players, fromSeat);
      consecutiveSixes.current = 0;
      setDie(null);
      setMoves([]);
      setRollSpent(false);
      const advanced: LudoRoomState = {
        ...current,
        activeSeat: next.activeSeat,
        turn: current.turn + next.turnDelta,
        turnSecondsLeft: MATCH_TURN_SECONDS,
        lastRoll: null,
      };
      stateRef.current = advanced;
      setState(advanced);
      if (note) {
        appendLog({ seat: fromSeat, message: note });
      }
      const nxt = current.players.find((p) => p.position === next.activeSeat);
      appendLog({
        seat: next.activeSeat,
        message: `${nxt?.isYou ? "Your" : `${nxt?.username}'s`} turn.`,
      });
    },
    [appendLog],
  );

  const applyMoveToState = useCallback(
    (
      current: LudoRoomState,
      seat: number,
      move: MovePreview,
      captures: ReturnType<typeof findCaptures>,
    ): LudoRoomState => ({
      ...current,
      players: current.players.map((player) => {
        if (player.position === seat) {
          const nextPawns = player.pawns.map((pawn) =>
            pawn.id === move.pawnId ? move.next : pawn,
          );
          return {
            ...player,
            pawns: nextPawns,
            status: nextPawns.every((pawn) => pawn.status === "finished")
              ? "finished"
              : player.status,
          };
        }

        const hit = captures.filter(
          (entry) => entry.victimSeat === player.position,
        );
        if (hit.length === 0) return player;

        return {
          ...player,
          pawns: player.pawns.map((pawn) =>
            hit.some((entry) => entry.victimPawnId === pawn.id)
              ? sendHome(pawn)
              : pawn,
          ),
        };
      }),
    }),
    [],
  );

  const finishMove = useCallback(
    (move: MovePreview, roll: DieValue, seat: number) => {
      const snapshot = stateRef.current;
      const mover = snapshot.players.find((p) => p.position === seat);
      const who = mover?.isYou ? "You" : mover?.username ?? "Player";
      const captures = findCaptures(snapshot, seat, move.next);
      const nextState = applyMoveToState(snapshot, seat, move, captures);

      const label =
        move.next.status === "finished"
          ? "finished a pawn"
          : move.next.status === "home"
            ? "entered the home lane"
            : move.next.status === "track" && move.next.steps === 0
              ? "released a pawn"
              : "moved a pawn";

      let log = nextState.log;
      const addLog = (entrySeat: number | null, message: string) => {
        log = [
          {
            id: `l-${log.length + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            seat: entrySeat,
            message,
          },
          ...log,
        ];
      };

      addLog(seat, `${who} ${label}.`);

      if (captures.length > 0) {
        const first = captures[0];
        const point = cellCenter(first.cell[0], first.cell[1]);
        const trips: Record<string, [number, number][]> = {};
        setCapture({
          id: `${first.victimPawnId}-${Date.now()}`,
          x: point.x,
          y: point.y,
          victimSeat: first.victimSeat,
        });
        void playCaptureSound();
        for (const hit of captures) {
          const victim = snapshot.players.find(
            (player) => player.position === hit.victimSeat,
          );
          const pawn = victim?.pawns.find(
            (entry) => entry.id === hit.victimPawnId,
          );
          if (pawn) {
            trips[pawn.id] = captureReturnPath(hit.victimSeat, pawn);
          }
          addLog(seat, `${who} captured ${victim?.username ?? "a rival"}'s pawn!`);
        }
        setReturnPaths((prev) => ({ ...prev, ...trips }));
      }

      const updatedMover = nextState.players.find((p) => p.position === seat);
      const won =
        updatedMover &&
        (updatedMover.status === "finished" ||
          pawnsFinished(updatedMover) >= 4);

      setMovingId(null);
      setMovePath(null);
      setMoves([]);
      setDie(null);
      busyRef.current = false;

      if (won) {
        addLog(seat, `${who} win${mover?.isYou ? "" : "s"} the room!`);
        const finishedState = { ...nextState, lastRoll: null, log };
        stateRef.current = finishedState;
        setState(finishedState);
        setRollSpent(true);
        return;
      }

      const keep = grantsExtraTurn({
        roll,
        movedPawn: move.next,
        captured: captures.length > 0,
      });

      if (keep) {
        if (captures.length > 0) addLog(seat, "Capture! Roll again.");
        else if (move.next.status === "finished") addLog(seat, "Pawn home! Roll again.");
        else if (roll === 6) addLog(seat, "Rolled a 6 · roll again.");
        const extra = { ...nextState, lastRoll: null, log };
        stateRef.current = extra;
        setState(extra);
        setRollSpent(false);
        return;
      }

      consecutiveSixes.current = 0;
      setRollSpent(false);
      const next = nextActiveSeat(nextState.players, seat);
      const nxt = nextState.players.find((p) => p.position === next.activeSeat);
      addLog(
        next.activeSeat,
        `${nxt?.isYou ? "Your" : `${nxt?.username}'s`} turn.`,
      );
      const advanced: LudoRoomState = {
        ...nextState,
        activeSeat: next.activeSeat,
        turn: nextState.turn + next.turnDelta,
        turnSecondsLeft: MATCH_TURN_SECONDS,
        lastRoll: null,
        log,
      };
      stateRef.current = advanced;
      setState(advanced);
    },
    [applyMoveToState],
  );

  const handleReturnComplete = useCallback((pawnId: string) => {
    setReturnPaths((prev) => {
      if (!prev[pawnId]) return prev;
      const next = { ...prev };
      delete next[pawnId];
      return next;
    });
  }, []);

  const startHop = useCallback((move: MovePreview) => {
    pendingMove.current = move;
    setMoves([]);
    setMovingId(move.pawnId);
    setMovePath(move.path);
  }, []);

  const resolveRoll = useCallback(
    (result: DieValue, seat: number, roller: LudoPlayer) => {
      const who = roller.isYou ? "You" : roller.username;
      const snapshot = stateRef.current;

      if (result === 6) {
        const { nextCount, voided } = registerSixRoll(consecutiveSixes.current);
        consecutiveSixes.current = nextCount;
        if (voided) {
          appendLog({
            seat,
            message: `${who} rolled a third 6 · turn forfeited.`,
          });
          setDie(result);
          setRolling(false);
          setRollSpent(true);
          setState((prev) => ({ ...prev, lastRoll: null }));
          const t = window.setTimeout(() => {
            advanceTurn(seat);
            busyRef.current = false;
          }, 500);
          timers.current.push(t);
          return;
        }
      } else {
        consecutiveSixes.current = registerNonSixRoll().nextCount;
      }

      setDie(result);
      setRolling(false);
      const withRoll = { ...snapshot, lastRoll: result };
      stateRef.current = withRoll;
      setState(withRoll);
      appendLog({ seat, message: `${who} rolled a ${result}.` });

      const legal = movablePawns(snapshot, roller, result);
      if (legal.length === 0) {
        appendLog({
          seat,
          message: `${roller.isYou ? "You have" : `${roller.username} has`} no legal moves.`,
        });
        setRollSpent(true);
        const t = window.setTimeout(() => {
          advanceTurn(seat);
          busyRef.current = false;
        }, 600);
        timers.current.push(t);
        return;
      }

      if (roller.isYou) {
        busyRef.current = false;
        if (legal.length === 1) {
          startHop(legal[0]);
          return;
        }
        setMoves(legal);
        appendLog({ seat, message: "Pick a pawn to move." });
        return;
      }

      // NPC picks immediately after the reveal.
      const choice = chooseNpcMove(snapshot, roller, result) ?? legal[0];
      startHop(choice);
    },
    [advanceTurn, appendLog, startHop],
  );

  const performRoll = useCallback(
    (seat: number) => {
      const snapshot = stateRef.current;
      if (finished || busyRef.current) return;
      if (snapshot.activeSeat !== seat) return;
      if (snapshot.lastRoll !== null) return;
      if (movingId || awaitingPick || rolling) return;

      const roller = snapshot.players.find((player) => player.position === seat);
      if (!roller || roller.status !== "alive") return;

      busyRef.current = true;
      setRolling(true);
      setDie(null);
      setMoves([]);
      setRollSpent(false);

      const result = randomDie();
      const reveal = window.setTimeout(() => {
        resolveRoll(result, seat, roller);
      }, ROLL_MS);
      timers.current.push(reveal);
    },
    [awaitingPick, finished, movingId, resolveRoll, rolling],
  );

  const handleRoll = useCallback(() => {
    if (!yourTurn || !canRoll || finished) return;
    performRoll(state.activeSeat);
  }, [canRoll, finished, performRoll, state.activeSeat, yourTurn]);

  const handleHopComplete = useCallback(() => {
    const move = pendingMove.current;
    pendingMove.current = null;
    const roll = stateRef.current.lastRoll as DieValue | null;
    const seat = stateRef.current.activeSeat;
    if (!move || roll === null) {
      setMovingId(null);
      setMovePath(null);
      busyRef.current = false;
      return;
    }
    finishMove(move, roll, seat);
  }, [finishMove]);

  const handleSelect = useCallback(
    (pawnId: string) => {
      const move = moves.find((entry) => entry.pawnId === pawnId);
      if (!move || movingId || !yourTurn) return;
      startHop(move);
    },
    [moves, movingId, startHop, yourTurn],
  );

  const handleEndTurn = useCallback(() => {
    if (!yourTurn || rolling || awaitingPick || movingId || finished) return;
    if (busyRef.current) return;
    if (state.lastRoll !== null && !rollSpent) return;
    advanceTurn(state.activeSeat);
  }, [
    advanceTurn,
    awaitingPick,
    finished,
    movingId,
    rollSpent,
    rolling,
    state.activeSeat,
    state.lastRoll,
    yourTurn,
  ]);

  const handleAfkExpire = useCallback(() => {
    if (busyRef.current) return;
    const snapshot = stateRef.current;
    const actor = snapshot.players.find((player) => player.isYou);
    if (!actor || actor.status !== "alive") return;
    if (snapshot.activeSeat !== actor.position) return;
    if (snapshot.lastRoll !== null) return;
    consecutiveSixes.current = 0;
    const result = recordLudoAfkMiss(snapshot, actor.position);
    stateRef.current = result.state;
    setState(result.state);
    setDie(null);
    setMoves([]);
    setRollSpent(false);
    busyRef.current = false;
    if (result.kicked) onAfkKick?.();
  }, [onAfkKick]);

  const clockKey = `${state.activeSeat}-${state.turn}-${state.lastRoll ?? "roll"}`;

  // NPC auto-roll when it becomes their turn.
  useEffect(() => {
    if (finished || rolling || movingId || awaitingPick) return;
    if (state.lastRoll !== null) return;
    if (rollSpent) return;

    const seat = state.activeSeat;
    const actor = state.players.find((player) => player.position === seat);
    if (!actor || actor.isYou || actor.status !== "alive") return;
    if (!isPlayBot(actor.id)) return;

    const t = window.setTimeout(() => {
      performRoll(seat);
    }, NPC_THINK_MS);
    timers.current.push(t);
    return () => window.clearTimeout(t);
  }, [
    awaitingPick,
    finished,
    movingId,
    performRoll,
    rollSpent,
    rolling,
    state.activeSeat,
    state.lastRoll,
    state.players,
  ]);

  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(180px,220px)_minmax(0,1fr)_minmax(220px,280px)] xl:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(240px,300px)]">
      <div className="order-1 flex flex-col gap-3 sm:gap-4 lg:order-2 lg:gap-5">
        <LudoBoardStage
          className="max-w-[min(100%,72vh)] sm:max-w-[min(100%,78vh)]"
          overlay={
            <>
              <LudoPawnLayer
                pawns={pawns}
                selectableIds={
                  finished || !yourTurn
                    ? []
                    : moves.map((move) => move.pawnId)
                }
                movingId={movingId}
                movePath={movePath}
                returnPaths={returnPaths}
                onSelect={handleSelect}
                onMoveComplete={handleHopComplete}
                onReturnComplete={handleReturnComplete}
              />
              {capture && !finished && (
                <CaptureBurst
                  event={capture}
                  onDone={() => setCapture(null)}
                />
              )}
              {winner && !youOut && <WinnerScreen winner={winner} game="ludo" />}
            </>
          }
        />
        <RoomTurnClock
          running={rollWindow}
          resetKey={clockKey}
          strikes={youStrikes}
          onExpire={handleAfkExpire}
          onClock={onClock}
        >
          {(secondsLeft) => (
            <LudoActionBar
              yourTurn={yourTurn && !awaitingPick && !movingId && !finished && !youOut}
              rolling={rolling}
              canRoll={canRoll}
              canEndTurn={rollSpent}
              value={die}
              secondsLeft={secondsLeft}
              onRoll={handleRoll}
              onEndTurn={handleEndTurn}
            />
          )}
        </RoomTurnClock>
        <p className="text-center font-mono text-xs uppercase tracking-wide text-faint">
          {finished
            ? "Match over"
            : awaitingPick
              ? "Tap a glowing pawn to move"
              : !yourTurn
                ? `${activePlayer?.username ?? "Rival"} is playing…`
                : canRoll
                  ? "6 exits yard · capture / 6 / finish = extra roll · 3 sixes ends turn"
                  : "Resolving…"}
        </p>
      </div>

      <LudoPlayerRail
        players={players}
        activeSeat={state.activeSeat}
        className="order-2 lg:order-1"
      />

      <aside className="order-3 flex flex-col gap-4 lg:sticky lg:top-5 lg:self-start lg:gap-5">
        <FinishCountPanel players={players} />

        <details className="group lg:hidden">
          <summary className="pixel-corners mb-2 cursor-pointer list-none border-2 border-edge bg-surface px-3 py-2 font-pixel text-xs uppercase text-muted marker:content-none">
            Activity
            <span className="float-right text-faint group-open:hidden">
              Show
            </span>
            <span className="float-right hidden text-faint group-open:inline">
              Hide
            </span>
          </summary>
          <ActivityLog entries={state.log} palette="ludo" className="max-h-48" />
        </details>

        <ActivityLog
          entries={state.log}
          palette="ludo"
          className="hidden max-h-none lg:flex"
        />
      </aside>
    </div>
  );
});
