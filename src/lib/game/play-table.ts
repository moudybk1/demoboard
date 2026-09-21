import type { GameType } from "@/lib/types";

export type PlayTableStatus = "waiting" | "playing" | "cancelled";

export type PlayTableSeatView = {
  address: string;
  username: string;
  seat: number;
  ready: boolean;
};

export type PlayTableView = {
  id: string;
  game: GameType;
  status: PlayTableStatus;
  entryFee: number;
  maxPlayers: number;
  seats: PlayTableSeatView[];
  refundTxHash: string | null;
  version: number;
};

export type PlaySeatRecord = {
  tableId: string;
  address: string;
  seat: number;
  leaveToken: string;
};

const SEAT_KEY = "board.play.seat";

export function savePlaySeat(record: PlaySeatRecord) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SEAT_KEY, JSON.stringify(record));
  } catch {
    // ignore quota / private mode
  }
}

export function readPlaySeat(): PlaySeatRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SEAT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaySeatRecord;
    if (!parsed?.tableId || !parsed.address || !parsed.leaveToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaySeat() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SEAT_KEY);
  } catch {
    // ignore
  }
}

export function isPlayBot(id: string) {
  return id.startsWith("bot-");
}
