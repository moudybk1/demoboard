import { MATCH_TURN_SECONDS } from "@/lib/game/match-clock";
import type { LudoPawn, LudoRoomState } from "@/lib/mock/ludo";
import type { Db } from "@/server/db";
import {
  ludoLogs,
  ludoMatches,
  ludoPawns,
  ludoPlayers,
} from "@/server/db/schema";

/** Seconds granted for each Ludo turn clock. */
export const LUDO_TURN_SECONDS = MATCH_TURN_SECONDS;

export type LudoSeatSeed = {
  userId: string;
  username: string;
  seat: number;
};

/** Db or transaction surface used while seeding Ludo match rows. */
type DbLike = Pick<Db, "insert">;

function yardPawns(seat: number): LudoPawn[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `p${seat}-${index}`,
    index,
    status: "yard" as const,
    steps: 0,
  }));
}

/**
 * Seed Ludo tables when a waiting room kicks off (all seats filled + ready).
 */
export async function seedLudoMatch(
  tx: DbLike,
  args: {
    matchId: string;
    roomCode: string;
    entryFee: number;
    maxPlayers: number;
    seats: LudoSeatSeed[];
    startedAt?: Date;
  },
): Promise<LudoRoomState> {
  const startedAt = args.startedAt ?? new Date();
  const turnEndsAt = new Date(
    startedAt.getTime() + LUDO_TURN_SECONDS * 1000,
  );

  await tx.insert(ludoMatches).values({
    matchId: args.matchId,
    activeSeat: 1,
    turn: 1,
    turnEndsAt,
    lastRoll: null,
    updatedAt: startedAt,
  });

  await tx.insert(ludoPlayers).values(
    args.seats.map((seat) => ({
      matchId: args.matchId,
      userId: seat.userId,
      seat: seat.seat,
      status: "alive" as const,
      ready: true,
    })),
  );

  const pawnRows = args.seats.flatMap((seat) =>
    [0, 1, 2, 3].map((pawnIndex) => ({
      matchId: args.matchId,
      seat: seat.seat,
      pawnIndex,
      status: "yard" as const,
      steps: 0,
    })),
  );
  await tx.insert(ludoPawns).values(pawnRows);

  await tx.insert(ludoLogs).values({
    matchId: args.matchId,
    seat: null,
    message: "Match started. Roll a 6 to leave the yard. Capture, 6, or finish = extra roll. Three 6s ends your turn.",
    createdAt: startedAt,
  });

  return buildLudoState({
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

export function buildLudoState(args: {
  roomId: string;
  entryFee: number;
  maxPlayers: number;
  activeSeat: number;
  turn: number;
  turnEndsAt: Date;
  seats: LudoSeatSeed[];
  now?: Date;
  lastRoll?: number | null;
  pawnsBySeat?: Record<number, LudoPawn[]>;
  statusBySeat?: Record<number, "alive" | "finished">;
  log?: LudoRoomState["log"];
}): LudoRoomState {
  const now = args.now ?? new Date();
  const turnSecondsLeft = Math.max(
    0,
    Math.ceil((args.turnEndsAt.getTime() - now.getTime()) / 1000),
  );

  return {
    rulesVersion: 1,
    roomId: args.roomId,
    entryFee: args.entryFee,
    maxPlayers: args.maxPlayers,
    activeSeat: args.activeSeat,
    turn: args.turn,
    turnSecondsLeft,
    lastRoll: args.lastRoll ?? null,
    players: args.seats
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((seat) => ({
        id: seat.userId,
        username: seat.username,
        position: seat.seat,
        status: args.statusBySeat?.[seat.seat] ?? "alive",
        pawns: args.pawnsBySeat?.[seat.seat] ?? yardPawns(seat.seat),
        isYou: false,
      })),
    log: args.log ?? [
      {
        id: "start",
        seat: null,
        message: "Match started. Roll a 6 to leave the yard. Capture, 6, or finish = extra roll. Three 6s ends your turn.",
      },
    ],
  };
}

export function startLudoMock(
  roomId: string,
  entryFee: number,
  maxPlayers: number,
  seats: LudoSeatSeed[],
): LudoRoomState {
  const now = new Date();
  return buildLudoState({
    roomId,
    entryFee,
    maxPlayers,
    activeSeat: 1,
    turn: 1,
    turnEndsAt: new Date(now.getTime() + LUDO_TURN_SECONDS * 1000),
    seats,
    now,
  });
}
