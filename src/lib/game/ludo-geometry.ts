import { HOME_LANES, LUDO_SIZE, YARD_BOUNDS } from "@/lib/game/ludo-board";
import type { LudoPawn, LudoPlayer } from "@/lib/mock/ludo";

/**
 * Board geometry for Ludo pawns. Positions are percentages of the board box
 * so overlays stay correct at every size without measuring the DOM.
 */

const CELL = 100 / LUDO_SIZE;

export type BoardPoint = { x: number; y: number };

export function cellCenter(row: number, col: number): BoardPoint {
  return {
    x: (col + 0.5) * CELL,
    y: (row + 0.5) * CELL,
  };
}

/** Four pad centres inside a seat's yard, as [row, col]. */
export function yardPadCells(seat: number): [number, number][] {
  const bounds = YARD_BOUNDS[seat];
  const originR = bounds.rows[0];
  const originC = bounds.cols[0];
  return [
    [originR + 1, originC + 1],
    [originR + 1, originC + 3],
    [originR + 3, originC + 1],
    [originR + 3, originC + 3],
  ];
}

/**
 * Shared outer track · 56 orthogonally adjacent cells.
 * Order is counter-clockwise starting at seat 1's entry [13,6].
 * After a near-full lap each seat turns into its home lane from the cell
 * immediately before re-passing its start (see {@link TRACK_STEPS_BEFORE_HOME}).
 */
export const SHARED_TRACK: readonly [number, number][] = [
  // Seat 1 entry · bottom arm, left of home column
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 6],
  // Left arm (down → up along left edge of cross)
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
  // Seat 2 entry [6,1]
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [6, 6],
  // Top arm
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  // Seat 3 entry [1,8]
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 8],
  // Right arm
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  // Seat 4 entry [8,13]
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [8, 8],
  // Bottom arm (right side) back toward seat 1
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7], // seat 1 home approach
  [14, 6], // last cell before wrapping to entry
];

/**
 * Steps from a seat's entry to its home-approach cell (inclusive of entry as 0).
 * On this cell, further pips turn into the coloured home lane.
 */
export const TRACK_STEPS_BEFORE_HOME = SHARED_TRACK.length - 2; // 54

/** Track index of each seat's entry cell. */
export const SEAT_ENTRY_INDEX: Record<number, number> = {
  1: 0, // [13, 6]
  2: 14, // [6, 1]
  3: 28, // [1, 8]
  4: 42, // [8, 13]
};

export function trackCellForSeat(
  seat: number,
  steps: number,
): [number, number] {
  const start = SEAT_ENTRY_INDEX[seat];
  const index = (start + steps) % SHARED_TRACK.length;
  return SHARED_TRACK[index];
}

export function pawnCell(
  seat: number,
  pawn: LudoPawn,
): [number, number] | null {
  if (pawn.status === "yard") return yardPadCells(seat)[pawn.index];
  if (pawn.status === "track") return trackCellForSeat(seat, pawn.steps);
  if (pawn.status === "home") {
    const lane = HOME_LANES[seat];
    return lane[Math.min(pawn.steps, lane.length - 1)];
  }
  if (pawn.status === "finished") return [7, 7];
  return null;
}

/**
 * Cells a captured pawn walks, from the square it was taken on back to its
 * yard pad. Long trips skip cells so the return stays readable.
 */
export function captureReturnPath(
  seat: number,
  pawn: LudoPawn,
): [number, number][] {
  const home = yardPadCells(seat)[pawn.index];
  if (pawn.status !== "track") return [home];

  const stride = pawn.steps > 24 ? 3 : pawn.steps > 12 ? 2 : 1;
  const cells: [number, number][] = [];
  const push = (cell: [number, number]) => {
    const prev = cells[cells.length - 1];
    if (prev && prev[0] === cell[0] && prev[1] === cell[1]) return;
    cells.push(cell);
  };

  for (let step = pawn.steps - stride; step > 0; step -= stride) {
    push(trackCellForSeat(seat, step));
  }
  push(trackCellForSeat(seat, 0));
  push(home);
  return cells;
}

export function pawnPoint(seat: number, pawn: LudoPawn): BoardPoint | null {
  const cell = pawnCell(seat, pawn);
  if (!cell) return null;
  return cellCenter(cell[0], cell[1]);
}

export type LudoPawnView = {
  id: string;
  seat: number;
  username: string;
  pawnIndex: number;
  status: LudoPawn["status"];
  point: BoardPoint;
};

export function pawnsForBoard(players: LudoPlayer[]): LudoPawnView[] {
  const views: LudoPawnView[] = [];
  for (const player of players) {
    for (const pawn of player.pawns) {
      const point = pawnPoint(player.position, pawn);
      if (!point) continue;
      views.push({
        id: pawn.id,
        seat: player.position,
        username: player.username,
        pawnIndex: pawn.index,
        status: pawn.status,
        point,
      });
    }
  }
  return views;
}
