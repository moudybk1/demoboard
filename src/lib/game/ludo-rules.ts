import type { DieValue } from "@/lib/game/dice";
import { MATCH_AFK_STRIKES, MATCH_TURN_SECONDS } from "@/lib/game/match-clock";
import { HOME_BRIDGE, HOME_LANES, SAFE_CELLS } from "@/lib/game/ludo-board";
import {
  TRACK_STEPS_BEFORE_HOME,
  pawnCell,
  trackCellForSeat,
} from "@/lib/game/ludo-geometry";
import type { LudoPawn, LudoPlayer, LudoRoomState } from "@/lib/mock/ludo";

/**
 * BOARD Ludo rules · aligned with common classic / Ludo King play:
 *
 * 1. One die. Roll a 6 to leave the yard onto your start square (safe).
 * 2. A 6 grants another roll. Three consecutive 6s voids the third roll
 *    and ends the turn.
 * 3. Landing on a single opponent on an unsafe cell captures them (back to
 *    yard) and grants another roll.
 * 4. Two or more of your pawns on one cell form a blockade: opponents cannot
 *    land on or pass that cell.
 * 5. Star squares and colour start squares are safe (no capture).
 * 6. Home column is exact-count only. A pawn may finish on the same roll that
 *    leaves the shared track when the count is exact.
 * 7. Finishing a pawn grants another roll (unless that ends the match).
 * 8. First player to finish all four pawns wins.
 */

/** Steps on the shared track before a seat may enter its home lane. */
export const TRACK_BEFORE_HOME = TRACK_STEPS_BEFORE_HOME;

/** Max consecutive 6s before the turn is cancelled. */
export const MAX_CONSECUTIVE_SIXES = 3;

export type MovePreview = {
  pawnId: string;
  next: LudoPawn;
  /** Cells the pawn hops through (excluding start, including end). */
  path: [number, number][];
};

type Occupant = { seat: number; pawnId: string };

function isSafeCell(row: number, col: number) {
  return SAFE_CELLS.some(([r, c]) => r === row && c === col);
}

/** All track pawns currently sitting on a cell. */
export function occupantsOnCell(
  state: LudoRoomState,
  row: number,
  col: number,
  ignorePawnId?: string,
): Occupant[] {
  const found: Occupant[] = [];
  for (const player of state.players) {
    for (const pawn of player.pawns) {
      if (pawn.id === ignorePawnId) continue;
      if (pawn.status !== "track") continue;
      const cell = pawnCell(player.position, pawn);
      if (!cell) continue;
      if (cell[0] === row && cell[1] === col) {
        found.push({ seat: player.position, pawnId: pawn.id });
      }
    }
  }
  return found;
}

/** Two+ pawns of the same seat on one cell = blockade. */
export function blockadeSeatOnCell(
  state: LudoRoomState,
  row: number,
  col: number,
  ignorePawnId?: string,
): number | null {
  const occupants = occupantsOnCell(state, row, col, ignorePawnId);
  const bySeat = new Map<number, number>();
  for (const entry of occupants) {
    bySeat.set(entry.seat, (bySeat.get(entry.seat) ?? 0) + 1);
  }
  for (const [seat, count] of bySeat) {
    if (count >= 2) return seat;
  }
  return null;
}

/**
 * Opposing blockade: cannot land on or pass through.
 * Own blockade: friendly, can stack / pass.
 */
function blockedByOpponent(
  state: LudoRoomState,
  moverSeat: number,
  row: number,
  col: number,
  movingPawnId: string,
): boolean {
  const blockSeat = blockadeSeatOnCell(state, row, col, movingPawnId);
  return blockSeat !== null && blockSeat !== moverSeat;
}

function pathIsLegal(
  state: LudoRoomState,
  seat: number,
  pawnId: string,
  path: [number, number][],
): boolean {
  for (const [row, col] of path) {
    if (blockedByOpponent(state, seat, row, col, pawnId)) return false;
  }
  return true;
}

/**
 * Which of the current player's pawns can legally move with this roll.
 */
export function movablePawns(
  state: LudoRoomState,
  player: LudoPlayer,
  roll: DieValue,
): MovePreview[] {
  return player.pawns
    .map((pawn) => previewMove(state, player.position, pawn, roll))
    .filter((move): move is MovePreview => move !== null);
}

export function previewMove(
  state: LudoRoomState,
  seat: number,
  pawn: LudoPawn,
  roll: DieValue,
): MovePreview | null {
  if (pawn.status === "finished") return null;

  if (pawn.status === "yard") {
    if (roll !== 6) return null;
    const entry = trackCellForSeat(seat, 0);
    const path: [number, number][] = [entry];
    if (!pathIsLegal(state, seat, pawn.id, path)) return null;
    return {
      pawnId: pawn.id,
      next: { ...pawn, status: "track", steps: 0 },
      path,
    };
  }

  if (pawn.status === "track") {
    const remaining = TRACK_BEFORE_HOME - pawn.steps;
    const lane = HOME_LANES[seat];

    if (roll <= remaining) {
      const path = pathAlongTrack(seat, pawn.steps, roll);
      if (!pathIsLegal(state, seat, pawn.id, path)) return null;
      return {
        pawnId: pawn.id,
        next: { ...pawn, steps: pawn.steps + roll },
        path,
      };
    }

    // Pips into the home stretch after leaving the track.
    // 1 → first home cell (intoHome 0); lane.length + 0 → last cell;
    // lane.length → finish (exact). From the door, a 6 finishes.
    const intoHome = roll - remaining - 1;
    if (intoHome < 0 || intoHome > lane.length) return null;

    const onTrack = pathAlongTrack(seat, pawn.steps, remaining);
    if (intoHome === lane.length) {
      const path: [number, number][] = [
        ...onTrack,
        ...(lane as [number, number][]),
        HOME_BRIDGE[seat],
        [7, 7],
      ];
      // Home lane + finish are private; only shared-track segment can block.
      if (!pathIsLegal(state, seat, pawn.id, onTrack)) return null;
      return {
        pawnId: pawn.id,
        next: { ...pawn, status: "finished", steps: 0 },
        path,
      };
    }

    const homePath = lane.slice(0, intoHome + 1) as [number, number][];
    const path: [number, number][] = [...onTrack, ...homePath];
    if (!pathIsLegal(state, seat, pawn.id, onTrack)) return null;
    return {
      pawnId: pawn.id,
      next: { ...pawn, status: "home", steps: intoHome },
      path,
    };
  }

  if (pawn.status === "home") {
    const lane = HOME_LANES[seat];
    const target = pawn.steps + roll;

    if (target === lane.length) {
      return {
        pawnId: pawn.id,
        next: { ...pawn, status: "finished", steps: 0 },
        path: [
          ...(lane.slice(pawn.steps + 1) as [number, number][]),
          HOME_BRIDGE[seat],
          [7, 7],
        ],
      };
    }

    if (target > lane.length - 1) return null;

    return {
      pawnId: pawn.id,
      next: { ...pawn, steps: target },
      path: lane.slice(pawn.steps + 1, target + 1) as [number, number][],
    };
  }

  return null;
}

function pathAlongTrack(
  seat: number,
  fromSteps: number,
  count: number,
): [number, number][] {
  return Array.from({ length: count }, (_, i) =>
    trackCellForSeat(seat, fromSteps + i + 1),
  );
}

export type CaptureResult = {
  victimSeat: number;
  victimPawnId: string;
  cell: [number, number];
};

/**
 * After a move lands, any single opponent pawns on that unsafe track cell
 * are captured. Blockades and safe cells cannot be captured.
 */
export function findCaptures(
  state: LudoRoomState,
  moverSeat: number,
  movedPawn: LudoPawn,
): CaptureResult[] {
  if (movedPawn.status !== "track") return [];

  const cell = pawnCell(moverSeat, movedPawn);
  if (!cell) return [];
  if (isSafeCell(cell[0], cell[1])) return [];

  // Cannot capture a blockade (should already be an illegal landing).
  if (blockadeSeatOnCell(state, cell[0], cell[1], movedPawn.id) !== null) {
    return [];
  }

  const captures: CaptureResult[] = [];

  for (const player of state.players) {
    if (player.position === moverSeat) continue;
    for (const pawn of player.pawns) {
      if (pawn.status !== "track") continue;
      const other = pawnCell(player.position, pawn);
      if (!other) continue;
      if (other[0] === cell[0] && other[1] === cell[1]) {
        captures.push({
          victimSeat: player.position,
          victimPawnId: pawn.id,
          cell,
        });
      }
    }
  }

  return captures;
}

export function sendHome(pawn: LudoPawn): LudoPawn {
  return { ...pawn, status: "yard", steps: 0 };
}

/**
 * Extra roll after a 6, a capture, or finishing a pawn.
 * Finishing the match still ends play via the win check.
 */
export function grantsExtraTurn(args: {
  roll: DieValue;
  movedPawn: LudoPawn;
  captured: boolean;
}): boolean {
  const { roll, movedPawn, captured } = args;
  if (roll === 6) return true;
  if (captured) return true;
  if (movedPawn.status === "finished") return true;
  return false;
}

/**
 * After rolling a 6, update the consecutive-six counter.
 * Returns whether this roll is voided (third six).
 */
export function registerSixRoll(consecutiveSixes: number): {
  nextCount: number;
  voided: boolean;
} {
  const nextCount = consecutiveSixes + 1;
  if (nextCount >= MAX_CONSECUTIVE_SIXES) {
    return { nextCount: 0, voided: true };
  }
  return { nextCount, voided: false };
}

export function registerNonSixRoll(): { nextCount: number; voided: boolean } {
  return { nextCount: 0, voided: false };
}

/** Pick next alive seat after the current one (skips finished / kicked players). */
export function nextActiveSeat(
  players: LudoPlayer[],
  currentSeat: number,
): { activeSeat: number; turnDelta: number } {
  const rotation = players
    .filter((player) => player.status === "alive")
    .map((player) => player.position)
    .sort((a, b) => a - b);

  if (rotation.length === 0) {
    return { activeSeat: currentSeat, turnDelta: 0 };
  }

  const idx = rotation.indexOf(currentSeat);
  const from = idx === -1 ? 0 : idx;
  const activeSeat = rotation[(from + 1) % rotation.length];
  const turnDelta = activeSeat <= currentSeat ? 1 : 0;
  return { activeSeat, turnDelta };
}

/**
 * Player ran out of time to roll. Passes the turn, or kicks after three misses.
 * Sit fee is not refunded on a kick.
 */
export function recordLudoAfkMiss(
  state: LudoRoomState,
  seat: number,
): { state: LudoRoomState; kicked: boolean } {
  const player = state.players.find((row) => row.position === seat);
  if (!player || player.status !== "alive") {
    return { state, kicked: false };
  }

  const strikes = { ...(state.afkStrikes ?? {}) };
  const count = (strikes[seat] ?? 0) + 1;
  strikes[seat] = count;
  const who = player.isYou ? "You" : player.username;

  const stamp = Date.now();
  const push = (
    current: LudoRoomState,
    entrySeat: number | null,
    message: string,
    id: string,
  ): LudoRoomState => ({
    ...current,
    log: [{ id, seat: entrySeat, message }, ...current.log],
  });

  if (count >= MATCH_AFK_STRIKES) {
    const players = state.players.map((row) =>
      row.position === seat ? { ...row, status: "eliminated" as const } : row,
    );
    let next: LudoRoomState = push(
      { ...state, players, afkStrikes: strikes, lastRoll: null },
      seat,
      `${who} missed ${MATCH_AFK_STRIKES} rolls and was kicked. Entry fee is not refunded.`,
      `afk-kick-${stamp}`,
    );
    if (next.activeSeat === seat) {
      const rot = nextActiveSeat(players, seat);
      const nxt = players.find((row) => row.position === rot.activeSeat);
      next = {
        ...next,
        activeSeat: rot.activeSeat,
        turn: next.turn + rot.turnDelta,
        turnSecondsLeft: MATCH_TURN_SECONDS,
        lastRoll: null,
      };
      next = push(
        next,
        rot.activeSeat,
        `${nxt?.isYou ? "Your" : `${nxt?.username}'s`} turn.`,
        `afk-next-${stamp}`,
      );
    }
    return { state: next, kicked: true };
  }

  const rot = nextActiveSeat(state.players, seat);
  const nxt = state.players.find((row) => row.position === rot.activeSeat);
  let next: LudoRoomState = {
    ...state,
    afkStrikes: strikes,
    activeSeat: rot.activeSeat,
    turn: state.turn + rot.turnDelta,
    turnSecondsLeft: MATCH_TURN_SECONDS,
    lastRoll: null,
  };
  next = push(
    next,
    seat,
    `${who} ran out of time (${count}/${MATCH_AFK_STRIKES}). Turn passed.`,
    `afk-${stamp}`,
  );
  next = push(
    next,
    rot.activeSeat,
    `${nxt?.isYou ? "Your" : `${nxt?.username}'s`} turn.`,
    `afk-next-${stamp}`,
  );
  return { state: next, kicked: false };
}

/** Simple NPC chooser: prefer captures, then exits, then furthest pawn. */
export function chooseNpcMove(
  state: LudoRoomState,
  player: LudoPlayer,
  roll: DieValue,
): MovePreview | null {
  const legal = movablePawns(state, player, roll);
  if (legal.length === 0) return null;

  const withCapture = legal.find(
    (move) => findCaptures(state, player.position, move.next).length > 0,
  );
  if (withCapture) return withCapture;

  const exit = legal.find(
    (move) =>
      move.next.status === "track" &&
      move.next.steps === 0 &&
      player.pawns.find((p) => p.id === move.pawnId)?.status === "yard",
  );
  if (exit) return exit;

  const finish = legal.find((move) => move.next.status === "finished");
  if (finish) return finish;

  return [...legal].sort((a, b) => {
    const aSteps =
      a.next.status === "track" || a.next.status === "home" ? a.next.steps : 99;
    const bSteps =
      b.next.status === "track" || b.next.status === "home" ? b.next.steps : 99;
    return bSteps - aSteps;
  })[0];
}
