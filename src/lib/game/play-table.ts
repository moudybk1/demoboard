import type { GameType } from "@/lib/types";

export type PlayTableStatus = "waiting" | "playing" | "cancelled";

export const PLAY_LOBBIES_PER_GAME = 4;

export type PlayLobbySlot = {
  id: string;
  game: GameType;
  slot: number;
  label: string;
};

export const PLAY_LOBBY_SLOTS: readonly PlayLobbySlot[] = [
  { id: "MNP-1", game: "monopoly", slot: 1, label: "Table 1" },
  { id: "MNP-2", game: "monopoly", slot: 2, label: "Table 2" },
  { id: "MNP-3", game: "monopoly", slot: 3, label: "Table 3" },
  { id: "MNP-4", game: "monopoly", slot: 4, label: "Table 4" },
  { id: "LUD-1", game: "ludo", slot: 1, label: "Table 1" },
  { id: "LUD-2", game: "ludo", slot: 2, label: "Table 2" },
  { id: "LUD-3", game: "ludo", slot: 3, label: "Table 3" },
  { id: "LUD-4", game: "ludo", slot: 4, label: "Table 4" },
] as const;

export function isPlayLobbySlotId(tableId: string) {
  const id = tableId.toUpperCase();
  return PLAY_LOBBY_SLOTS.some((slot) => slot.id === id);
}

export type PlayTableSeatView = {
  address: string;
  username: string;
  seat: number;
  ready: boolean;
};

export type PlayTableView = {
  id: string;
  game: GameType;
  label: string;
  slot: number;
  status: PlayTableStatus;
  entryFee: number;
  maxPlayers: number;
  seats: PlayTableSeatView[];
  refundTxHash: string | null;
  version: number;
};

/** Public lobby snapshot for one sit table. Occupancy is live, never invented. */
export type PlayLobbyGame = {
  tableId: string;
  game: GameType;
  label: string;
  slot: number;
  status: PlayTableStatus;
  entryFee: number;
  maxPlayers: number;
  seated: number;
  seatsLeft: number;
  seats: Array<{
    address: string;
    username: string;
    seat: number;
  }>;
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

/** House seats that fill a table so a solo sit can start a match. */
export const PLAY_HOUSE_NPCS = [
  { id: "bot-pixel", username: "PixelBaron" },
  { id: "bot-dice", username: "DiceDuchess" },
  { id: "bot-rent", username: "RentSeeker" },
] as const;
