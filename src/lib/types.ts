/**
 * Domain types shared by the UI and, later, the backend API. These mirror the
 * database schema in the PRD so the mock layer and the real API can be swapped
 * without touching components.
 */

export type GameType = "monopoly" | "ludo";

export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomPlayerStatus = "alive" | "eliminated" | "finished";

export const MAX_PLAYERS_PER_ROOM = 4;

/** Fee taken from the winner's prize pool, split between treasury and burn. */
export const PRIZE_FEE_RATE = 0.02;

export type PlayerSummary = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export type RoomPlayer = PlayerSummary & {
  /** Seat at the table, 1-4. */
  position: number;
  status: RoomPlayerStatus;
};

export type Room = {
  id: string;
  gameType: GameType;
  entryFee: number;
  maxPlayers: number;
  status: RoomStatus;
  players: RoomPlayer[];
  createdAt: string;
};

export type WalletBalance = {
  /** Spendable balance held by the platform on the player's behalf. */
  available: number;
  /** $USDG locked as entry fees in rooms that are still running. */
  locked: number;
  chain: string;
  address: string;
};

/** Total pot a room pays out before fees: entry fee x every seat. */
export function prizePool(room: Pick<Room, "entryFee" | "maxPlayers">) {
  return room.entryFee * room.maxPlayers;
}

/** What the winner actually receives once the 2% fee is taken. */
export function netPrize(room: Pick<Room, "entryFee" | "maxPlayers">) {
  return prizePool(room) * (1 - PRIZE_FEE_RATE);
}

export function seatsLeft(room: Room) {
  return room.maxPlayers - room.players.length;
}
