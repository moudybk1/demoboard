import { MATCH_TURN_SECONDS } from "@/lib/game/match-clock";
import { MONOPOLY_STARTING_CASH } from "@/lib/mock/monopoly";
import type { MonopolyRoomState } from "@/lib/mock/monopoly";
import type { Db } from "@/server/db";
import {
  monopolyLogs,
  monopolyMatches,
  monopolyPlayers,
} from "@/server/db/schema";

/** Seconds granted for each Monopoly turn clock. */
export const MONOPOLY_TURN_SECONDS = MATCH_TURN_SECONDS;

export type MonopolySeatSeed = {
  userId: string;
  username: string;
  seat: number;
};

/** Db or transaction surface used while seeding Monopoly match rows. */
type DbLike = Pick<Db, "insert">;

/**
 * Seed Monopoly tables when a match kicks off (room just hit 4 players).
 * Must run inside the same DB transaction that created the `matches` row.
 */
export async function seedMonopolyMatch(
  tx: DbLike,
  args: {
    matchId: string;
    roomCode: string;
    entryFee: number;
    maxPlayers: number;
    seats: MonopolySeatSeed[];
    startedAt?: Date;
  },
): Promise<MonopolyRoomState> {
  const startedAt = args.startedAt ?? new Date();
  const turnEndsAt = new Date(
    startedAt.getTime() + MONOPOLY_TURN_SECONDS * 1000,
  );

  await tx.insert(monopolyMatches).values({
    matchId: args.matchId,
    activeSeat: 1,
    turn: 1,
    turnEndsAt,
    updatedAt: startedAt,
  });

  await tx.insert(monopolyPlayers).values(
    args.seats.map((seat) => ({
      matchId: args.matchId,
      userId: seat.userId,
      seat: seat.seat,
      cash: MONOPOLY_STARTING_CASH.toFixed(2),
      tile: 0,
      status: "alive" as const,
    })),
  );

  await tx.insert(monopolyLogs).values({
    matchId: args.matchId,
    seat: null,
    message: "Match started. Roll the dice!",
    createdAt: startedAt,
  });

  return buildMonopolyState({
    roomId: args.roomCode,
    entryFee: args.entryFee,
    maxPlayers: args.maxPlayers,
    activeSeat: 1,
    turn: 1,
    turnEndsAt,
    seats: args.seats,
    now: startedAt,
  });
}

export function buildMonopolyState(args: {
  roomId: string;
  entryFee: number;
  maxPlayers: number;
  activeSeat: number;
  turn: number;
  turnEndsAt: Date;
  seats: MonopolySeatSeed[];
  now?: Date;
  owners?: Record<number, number>;
  cashBySeat?: Record<number, number>;
  tileBySeat?: Record<number, number>;
  statusBySeat?: Record<number, "alive" | "eliminated" | "finished">;
  log?: MonopolyRoomState["log"];
}): MonopolyRoomState {
  const now = args.now ?? new Date();
  const turnSecondsLeft = Math.max(
    0,
    Math.ceil((args.turnEndsAt.getTime() - now.getTime()) / 1000),
  );

  return {
    roomId: args.roomId,
    entryFee: args.entryFee,
    maxPlayers: args.maxPlayers,
    activeSeat: args.activeSeat,
    turn: args.turn,
    turnSecondsLeft,
    players: args.seats
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((seat) => ({
        id: seat.userId,
        username: seat.username,
        position: seat.seat,
        status: args.statusBySeat?.[seat.seat] ?? "alive",
        cash: args.cashBySeat?.[seat.seat] ?? MONOPOLY_STARTING_CASH,
        tile: args.tileBySeat?.[seat.seat] ?? 0,
        owned: Object.values(args.owners ?? {}).filter((s) => s === seat.seat)
          .length,
        isYou: false,
      })),
    owners: args.owners ?? {},
    log: args.log ?? [
      {
        id: "start",
        seat: null,
        message: "Match started. Roll the dice!",
      },
    ],
  };
}

/** In-memory auto-start payload for the mock join path. */
export function startMonopolyMock(
  roomId: string,
  entryFee: number,
  maxPlayers: number,
  seats: MonopolySeatSeed[],
): MonopolyRoomState {
  const now = new Date();
  return buildMonopolyState({
    roomId,
    entryFee,
    maxPlayers,
    activeSeat: 1,
    turn: 1,
    turnEndsAt: new Date(now.getTime() + MONOPOLY_TURN_SECONDS * 1000),
    seats,
    now,
  });
}
