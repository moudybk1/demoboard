"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionBar } from "@/components/room/action-bar";
import { ActivityLog } from "@/components/room/activity-log";
import { BoardStage } from "@/components/room/board-stage";
import { BuyPanel } from "@/components/room/buy-panel";
import {
  PawnLayer,
  type PawnState,
} from "@/components/room/pawn-layer";
import { RentToast, type RentNotice } from "@/components/room/rent-toast";
import { PlayerRail } from "@/components/room/player-rail";
import { WinnerScreen } from "@/components/room/winner-screen";
import { playSfx } from "@/lib/audio/audio-manager";
import { pathForward } from "@/lib/game/board-geometry";
import { BOARD_TILES } from "@/lib/game/monopoly-board";
import { rollDice, type DieValue } from "@/lib/game/dice";
import { saveMonopoly } from "@/lib/game/match-storage";
import { isPlayBot } from "@/lib/game/play-table";
import { useTurnClock } from "@/hooks/use-turn-clock";
import { MATCH_TURN_SECONDS, type TurnClockInfo } from "@/lib/game/match-clock";
import {
  applyRollMove,
  asPlayState,
  buyTile,
  JAIL_FINE,
  leaveJailByDoubles,
  leaveJailByFine,
  npcShouldBuy,
  recordAfkMiss,
  resolveLanding,
  soleWinner,
  stayInJail,
  advanceTurn,
  type MonopolyPlayState,
} from "@/lib/game/monopoly-rules";
import type { MonopolyRoomState } from "@/lib/mock/monopoly";

const ROLL_MS = 1400;
const NPC_THINK_MS = 750;

type HopMove = {
  seat: number;
  path: number[];
  landing: number;
  extraTurn: boolean;
};

export function MonopolyRoom({
  initialState,
  onClock,
  onAfkKick,
  clockPaused = false,
}: {
  initialState: MonopolyRoomState;
  onClock?: (clock: TurnClockInfo) => void;
  onAfkKick?: () => void;
  clockPaused?: boolean;
}) {
  const [state, setState] = useState<MonopolyPlayState>(() =>
    asPlayState(initialState),
  );
  const [dice, setDice] = useState<readonly [DieValue, DieValue] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [hop, setHop] = useState<HopMove | null>(null);
  const [pendingBuy, setPendingBuy] = useState<number | null>(null);
  const [rentNotice, setRentNotice] = useState<RentNotice | null>(null);
  const [rolledThisTurn, setRolledThisTurn] = useState(false);
  const timers = useRef<number[]>([]);
  const hopRef = useRef<HopMove | null>(null);
  const busyRef = useRef(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    saveMonopoly(state);
  }, [state]);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  useEffect(() => {
    hopRef.current = hop;
  }, [hop]);

  const players = useMemo(
    () => [...state.players].sort((a, b) => a.position - b.position),
    [state.players],
  );

  const pawns = useMemo<PawnState[]>(
    () =>
      players.map((player) => ({
        id: player.id,
        seat: player.position,
        username: player.username,
        tile: player.tile,
        eliminated: player.status === "eliminated",
      })),
    [players],
  );

  const you = players.find((player) => player.isYou);
  const yourTurn = you?.position === state.activeSeat;
  const youOut = you?.status === "eliminated";
  const activePlayer = players.find(
    (player) => player.position === state.activeSeat,
  );
  const youInJail = Boolean(you && state.extras[you.position]?.inJail);
  const canBuy =
    pendingBuy !== null &&
    (you?.cash ?? 0) >= (BOARD_TILES[pendingBuy]?.price ?? 0);

  const winner = useMemo(() => soleWinner(state), [state]);
  const finished = winner !== null;
  const rollWindow = Boolean(
    yourTurn &&
      !finished &&
      !youOut &&
      !rolling &&
      !hop &&
      pendingBuy === null &&
      !rolledThisTurn &&
      !clockPaused,
  );
  const youStrikes = you ? (state.extras[you.position]?.afkStrikes ?? 0) : 0;

  useEffect(() => {
    if (!finished || !winner) return;
    playSfx(winner.isYou ? "win" : "lose");
  }, [finished, winner]);

  const commit = useCallback((next: MonopolyPlayState) => {
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const finishTurn = useCallback(
    (current: MonopolyPlayState, seat: number, extraTurn: boolean) => {
      if (soleWinner(current)) {
        busyRef.current = false;
        setRolledThisTurn(false);
        setPendingBuy(null);
        return;
      }
      if (extraTurn && current.players.find((p) => p.position === seat)?.status === "alive") {
        busyRef.current = false;
        setRolledThisTurn(false);
        setDice(null);
        commit({
          ...current,
          cue: current.cue + 1,
          log: [
            {
              id: `extra-${Date.now()}`,
              seat,
              message: "Doubles! Roll again.",
            },
            ...current.log,
          ],
        });
        return;
      }
      const advanced = advanceTurn(current, seat);
      commit(advanced);
      busyRef.current = false;
      setRolledThisTurn(false);
      setDice(null);
      setPendingBuy(null);
    },
    [commit],
  );

  const afterLanding = useCallback(
    (landed: ReturnType<typeof resolveLanding>, seat: number) => {
      const current = commit(landed.state);
      if (landed.rent) {
        playSfx("rent");
        const payer = current.players.find((p) => p.position === landed.rent?.payerSeat);
        const owner = current.players.find((p) => p.position === landed.rent?.ownerSeat);
        setRentNotice({
          id: `${landed.rent.tileIndex}-${seat}-${Date.now()}`,
          country: BOARD_TILES[landed.rent.tileIndex]?.name ?? "City",
          amount: landed.rent.paid,
          payerSeat: landed.rent.payerSeat,
          payerName: payer?.isYou ? "You" : payer?.username ?? "Player",
          ownerSeat: landed.rent.ownerSeat,
          ownerName: owner?.isYou ? "You" : owner?.username ?? "Rival",
          bankrupted: landed.rent.bankrupted,
          youArePayer: Boolean(payer?.isYou),
        });
      }

      if (landed.goToJail || soleWinner(current)) {
        finishTurn(current, seat, false);
        return;
      }

      if (landed.pendingBuy !== null) {
        const actor = current.players.find((p) => p.position === seat);
        if (actor?.isYou) {
          setPendingBuy(landed.pendingBuy);
          busyRef.current = false;
          return;
        }
        if (npcShouldBuy(current, seat, landed.pendingBuy)) {
          const bought = buyTile(current, seat, landed.pendingBuy);
          if (bought) {
            playSfx("buy");
            finishTurn(commit(bought), seat, landed.extraTurn);
            return;
          }
        }
        finishTurn(current, seat, landed.extraTurn);
        return;
      }

      finishTurn(current, seat, landed.extraTurn);
    },
    [commit, finishTurn],
  );

  const handleHopComplete = useCallback(() => {
    const currentHop = hopRef.current;
    if (!currentHop) return;
    setHop(null);
    hopRef.current = null;
    const landed = resolveLanding(
      stateRef.current,
      currentHop.seat,
      currentHop.extraTurn,
    );
    afterLanding(landed, currentHop.seat);
  }, [afterLanding]);

  const performRoll = useCallback(
    (seat: number) => {
      if (finished || busyRef.current || hop) return;
      const snapshot = stateRef.current;
      const roller = snapshot.players.find((player) => player.position === seat);
      if (!roller || roller.status === "eliminated") return;
      if (snapshot.activeSeat !== seat) return;

      const jailed = Boolean(snapshot.extras[seat]?.inJail);
      busyRef.current = true;
      setRolling(true);
      setDice(null);
      setPendingBuy(null);

      const result = rollDice();
      const reveal = window.setTimeout(() => {
        setDice(result.dice);
        setRolling(false);
        setRolledThisTurn(true);

        if (jailed) {
          if (result.isDouble) {
            let next = leaveJailByDoubles(snapshot, seat);
            next = {
              ...next,
              log: [
                {
                  id: `jail-out-${Date.now()}`,
                  seat,
                  message: `${roller.isYou ? "You" : roller.username} rolled doubles and left Jail.`,
                },
                ...next.log,
              ],
            };
            const moved = applyRollMove(next, seat, result);
            commit(moved.state);
            const path = pathForward(moved.from, result.total);
            if (path.length === 0) {
              afterLanding(resolveLanding(moved.state, seat, false), seat);
              return;
            }
            const nextHop = { seat, path, landing: moved.to, extraTurn: false };
            hopRef.current = nextHop;
            setHop(nextHop);
            return;
          }
          finishTurn(stayInJail(snapshot, seat), seat, false);
          return;
        }

        const moved = applyRollMove(snapshot, seat, result);
        commit(moved.state);
        if (moved.goToJail) {
          finishTurn(moved.state, seat, false);
          return;
        }

        const path = pathForward(moved.from, result.total);
        if (path.length === 0) {
          afterLanding(
            resolveLanding(moved.state, seat, result.isDouble),
            seat,
          );
          return;
        }
        const nextHop = {
          seat,
          path,
          landing: moved.to,
          extraTurn: result.isDouble,
        };
        hopRef.current = nextHop;
        setHop(nextHop);
      }, ROLL_MS);

      timers.current.push(reveal);
    },
    [afterLanding, commit, finishTurn, finished, hop],
  );

  const handleRoll = useCallback(() => {
    if (!yourTurn || rolling || hop || finished || pendingBuy !== null) return;
    performRoll(state.activeSeat);
  }, [
    finished,
    hop,
    pendingBuy,
    performRoll,
    rolling,
    state.activeSeat,
    yourTurn,
  ]);

  const handleBuy = useCallback(() => {
    if (pendingBuy === null || finished) return;
    const bought = buyTile(stateRef.current, state.activeSeat, pendingBuy);
    if (!bought) return;
    playSfx("buy");
    setPendingBuy(null);
    const extra = Boolean(
      dice && dice[0] === dice[1] && !stateRef.current.extras[state.activeSeat]?.inJail,
    );
    finishTurn(commit(bought), state.activeSeat, extra);
  }, [commit, dice, finishTurn, finished, pendingBuy, state.activeSeat]);

  const handleDecline = useCallback(() => {
    if (pendingBuy === null || finished) return;
    const tile = BOARD_TILES[pendingBuy];
    setPendingBuy(null);
    const extra = Boolean(
      dice && dice[0] === dice[1] && !stateRef.current.extras[state.activeSeat]?.inJail,
    );
    const next = {
      ...stateRef.current,
      log: [
        {
          id: `pass-${Date.now()}`,
          seat: state.activeSeat,
          message: `You passed on ${tile?.name ?? "the city"}.`,
        },
        ...stateRef.current.log,
      ],
    };
    finishTurn(commit(next), state.activeSeat, extra);
  }, [commit, dice, finishTurn, finished, pendingBuy, state.activeSeat]);

  const handlePayJail = useCallback(() => {
    if (!yourTurn || finished || busyRef.current) return;
    const paid = leaveJailByFine(stateRef.current, state.activeSeat);
    if (!paid) return;
    commit(paid);
    busyRef.current = false;
    setRolledThisTurn(false);
  }, [commit, finished, state.activeSeat, yourTurn]);

  const handleEndTurn = useCallback(() => {
    if (!yourTurn || finished || hop || rolling || pendingBuy !== null) return;
    finishTurn(stateRef.current, state.activeSeat, false);
  }, [
    finishTurn,
    finished,
    hop,
    pendingBuy,
    rolling,
    state.activeSeat,
    yourTurn,
  ]);

  const handleAfkExpire = useCallback(() => {
    if (busyRef.current || hopRef.current) return;
    const snapshot = stateRef.current;
    const actor = snapshot.players.find((player) => player.isYou);
    if (!actor || actor.status === "eliminated") return;
    if (snapshot.activeSeat !== actor.position) return;
    const result = recordAfkMiss(snapshot, actor.position);
    commit(result.state);
    setRolledThisTurn(false);
    setDice(null);
    setPendingBuy(null);
    busyRef.current = false;
    if (result.kicked) onAfkKick?.();
  }, [commit, onAfkKick]);

  const secondsLeft = useTurnClock({
    running: rollWindow,
    resetKey: `${state.activeSeat}-${state.turn}-${state.cue}`,
    onExpire: handleAfkExpire,
  });

  useEffect(() => {
    onClock?.({
      seconds: rollWindow ? secondsLeft : MATCH_TURN_SECONDS,
      active: rollWindow,
      strikes: youStrikes,
    });
  }, [onClock, rollWindow, secondsLeft, youStrikes]);

  useEffect(() => {
    if (finished || rolling || hop || pendingBuy !== null) return;
    const seat = state.activeSeat;
    const actor = state.players.find((player) => player.position === seat);
    if (!actor || actor.isYou || actor.status === "eliminated") return;
    if (!isPlayBot(actor.id)) return;

    const think = window.setTimeout(() => {
      const jailed = Boolean(stateRef.current.extras[seat]?.inJail);
      if (jailed && (actor.cash > 220 || (stateRef.current.extras[seat]?.jailTurnsLeft ?? 3) <= 1)) {
        const paid = leaveJailByFine(stateRef.current, seat);
        if (paid) {
          busyRef.current = false;
          commit(paid);
          return;
        }
      }
      performRoll(seat);
    }, NPC_THINK_MS);
    timers.current.push(think);
    return () => window.clearTimeout(think);
  }, [
    commit,
    finished,
    hop,
    pendingBuy,
    performRoll,
    rolling,
    state.activeSeat,
    state.players,
    state.turn,
    state.cue,
  ]);

  return (
    <div className="flex flex-col gap-2 lg:gap-3">
      <div className="flex items-start gap-2 lg:gap-3">
        <PlayerRail
          players={players}
          activeSeat={state.activeSeat}
          className="hidden w-[6.75rem] shrink-0 lg:flex"
        />

        <div className="min-w-0 flex-1">
          <BoardStage
            owners={state.owners}
            activeTile={hop?.landing ?? activePlayer?.tile}
            className="mx-auto w-full max-w-[min(100%,calc(100vh-10.5rem))]"
            overlay={
              <>
                <PawnLayer
                  pawns={pawns}
                  movingSeat={hop?.seat ?? null}
                  movePath={hop?.path ?? null}
                  onMoveComplete={handleHopComplete}
                />
                {rentNotice && !finished && (
                  <RentToast
                    notice={rentNotice}
                    onDismiss={() => setRentNotice(null)}
                  />
                )}
                {pendingBuy !== null && !finished && (
                  <BuyPanel
                    tile={BOARD_TILES[pendingBuy]}
                    cash={you?.cash ?? 0}
                    onBuy={handleBuy}
                    onDecline={handleDecline}
                  />
                )}
                {winner && !youOut && <WinnerScreen winner={winner} game="monopoly" />}
              </>
            }
          />
        </div>

        <ActivityLog
          entries={state.log}
          className="hidden w-[12rem] shrink-0 self-stretch xl:flex xl:flex-col"
        />
      </div>

      <PlayerRail
        players={players}
        activeSeat={state.activeSeat}
        className="lg:hidden"
      />

      <ActionBar
        yourTurn={yourTurn && !finished && !hop && pendingBuy === null && !youOut}
        rolling={rolling}
        moving={Boolean(hop)}
        dice={dice}
        canBuy={canBuy && !finished}
        canPayJail={yourTurn && youInJail && !rolling && !hop && (you?.cash ?? 0) >= JAIL_FINE}
        hasRolled={rolledThisTurn}
        secondsLeft={rollWindow ? secondsLeft : null}
        onRoll={handleRoll}
        onBuy={handleBuy}
        onEndTurn={handleEndTurn}
        onPayJail={handlePayJail}
      />
      {hop ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-wide text-gold">
          Hopping {hop.path.length} {hop.path.length === 1 ? "tile" : "tiles"}
        </p>
      ) : youInJail && yourTurn && !finished ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-wide text-muted">
          In Jail. Roll doubles or pay {JAIL_FINE} BOARD.
        </p>
      ) : null}

      <ActivityLog entries={state.log} className="xl:hidden" />
    </div>
  );
}
