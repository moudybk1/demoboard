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

function walkOrthogonal(
  from: [number, number],
  to: [number, number],
  rowFirst: boolean,
): [number, number][] {
  const cells: [number, number][] = [];
  let row = from[0];
  let col = from[1];

  const stepRow = () => {
    while (row !== to[0]) {
      row += Math.sign(to[0] - row);
      cells.push([row, col]);
    }
  };
  const stepCol = () => {
    while (col !== to[1]) {
      col += Math.sign(to[1] - col);
      cells.push([row, col]);
    }
  };

  if (rowFirst) {
    stepRow();
    stepCol();
  } else {
    stepCol();
    stepRow();
  }
  return cells;
}

function outsideYard(seat: number, cells: [number, number][]) {
  const bounds = YARD_BOUNDS[seat];
  if (!bounds) return cells.length;
  return cells.filter(
    ([row, col]) =>
      row < bounds.rows[0] ||
      row > bounds.rows[1] ||
      col < bounds.cols[0] ||
      col > bounds.cols[1],
  ).length;
}

/** Orthogonal steps from a seat's entry square into its yard pad. */
function yardApproach(
  seat: number,
  entry: [number, number],
  pad: [number, number],
): [number, number][] {
  const rowFirst = walkOrthogonal(entry, pad, true);
  const colFirst = walkOrthogonal(entry, pad, false);
  const outsideRow = outsideYard(seat, rowFirst);
  const outsideCol = outsideYard(seat, colFirst);
  if (outsideRow !== outsideCol) {
    return outsideRow < outsideCol ? rowFirst : colFirst;
  }
  return rowFirst;
}

/**
 * Cells a captured pawn walks, from the square it was taken on back along
 * the track and into its yard pad. Every step is adjacent so the piece does
 * not cut across the board.
 */
export function captureReturnPath(
  seat: number,
  pawn: LudoPawn,
): [number, number][] {
  const home = yardPadCells(seat)[pawn.index];
  if (pawn.status !== "track") return [home];

  const cells: [number, number][] = [];
  const push = (cell: [number, number]) => {
    const prev = cells[cells.length - 1];
    if (prev && prev[0] === cell[0] && prev[1] === cell[1]) return;
    cells.push(cell);
  };

  for (let step = pawn.steps - 1; step >= 0; step -= 1) {
    push(trackCellForSeat(seat, step));
  }
  for (const cell of yardApproach(seat, trackCellForSeat(seat, 0), home)) {
    push(cell);
  }
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
