import { PLAY_ENTRY_FEE } from "@/lib/game/play-player";
import { MAX_PLAYERS_PER_ROOM, prizePool } from "@/lib/types";

/**
 * Stand-in state for a live Ludo room. Later tasks fill in the board, dice,
 * captures, and finish-line logic against these shapes.
 */

export type LudoPawnStatus = "yard" | "track" | "home" | "finished";

export type LudoPawn = {
  id: string;
  /** Seat-local pawn index, 0-3. */
  index: number;
  status: LudoPawnStatus;
  /**
   * Position on the shared track (0 .. TRACK_STEPS_BEFORE_HOME) when status is
   * `track`, or steps into the home column when status is `home`.
   * Yard / finished use 0.
   */
  steps: number;
};

export type LudoPlayer = {
  id: string;
  username: string;
  position: number;
  status: "alive" | "finished";
  pawns: LudoPawn[];
  isYou: boolean;
};

export type LudoLogEntry = {
  id: string;
  seat: number | null;
  message: string;
};

export type LudoRoomState = {
  roomId: string;
  entryFee: number;
  maxPlayers: number;
  activeSeat: number;
  turn: number;
  turnSecondsLeft: number;
  /** Last rolled die, or null before the first roll of the turn. */
  lastRoll: number | null;
  players: LudoPlayer[];
  log: LudoLogEntry[];
};

function yardPawns(seat: number): LudoPawn[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `p${seat}-${index}`,
    index,
    status: "yard" as const,
    steps: 0,
  }));
}

const LUDO_RIVALS = [
  { id: "bot-pixel", username: "PixelBaron" },
  { id: "bot-dice", username: "DiceDuchess" },
  { id: "bot-rent", username: "RentSeeker" },
] as const;

/** Fresh four-seat Ludo match. You plus three rivals, every pawn in the yard. */
export function createFreshLudoMatch(
  roomId: string,
  you?: { id?: string; username?: string },
): LudoRoomState {
  const state = createLudoMatchForSeats(roomId, [
    {
      id: you?.id ?? "u_me",
      username: you?.username ?? "You",
      seat: 1,
    },
    ...LUDO_RIVALS.map((rival, index) => ({
      id: rival.id,
      username: rival.username,
      seat: index + 2,
    })),
  ]);
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      isYou: player.position === 1,
    })),
  };
}

/** Four human seats. `isYou` is assigned on the client from the connected wallet. */
export function createLudoMatchForSeats(
  roomId: string,
  seats: { id: string; username: string; seat: number }[],
): LudoRoomState {
  return {
    roomId,
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    activeSeat: 1,
    turn: 1,
    turnSecondsLeft: 30,
    lastRoll: null,
    players: [...seats]
      .sort((left, right) => left.seat - right.seat)
      .map((seat) => ({
        id: seat.id,
        username: seat.username,
        position: seat.seat,
        status: "alive" as const,
        isYou: false,
        pawns: yardPawns(seat.seat),
      })),
    log: [
      {
        id: "start",
        seat: null,
        message:
          "Match started. Roll a 6 to leave the yard. First to finish all four pawns wins.",
      },
    ],
  };
}

export const MOCK_LUDO_ROOM: LudoRoomState = {
  roomId: "LUD-4468",
  entryFee: 1_000,
  maxPlayers: MAX_PLAYERS_PER_ROOM,
  activeSeat: 1,
  turn: 5,
  turnSecondsLeft: 22,
  lastRoll: null,
  players: [
    {
      id: "u_me",
      username: "Yoga",
      position: 1,
      status: "alive",
      isYou: true,
      pawns: [
        { id: "p1-0", index: 0, status: "track", steps: 8 },
        { id: "p1-1", index: 1, status: "track", steps: 3 },
        { id: "p1-2", index: 2, status: "finished", steps: 0 },
        { id: "p1-3", index: 3, status: "yard", steps: 0 },
      ],
    },
    {
      id: "u_04",
      username: "LudoLegend",
      position: 2,
      status: "alive",
      isYou: false,
      pawns: [
        { id: "p2-0", index: 0, status: "track", steps: 18 },
        { id: "p2-1", index: 1, status: "finished", steps: 0 },
        { id: "p2-2", index: 2, status: "finished", steps: 0 },
        { id: "p2-3", index: 3, status: "yard", steps: 0 },
      ],
    },
    {
      id: "u_07",
      username: "ChainRoller",
      position: 3,
      status: "alive",
      isYou: false,
      pawns: [
        { id: "p3-0", index: 0, status: "track", steps: 12 },
        { id: "p3-1", index: 1, status: "track", steps: 6 },
        { id: "p3-2", index: 2, status: "home", steps: 2 },
        { id: "p3-3", index: 3, status: "finished", steps: 0 },
      ],
    },
    {
      id: "u_10",
      username: "GoldGoblin",
      position: 4,
      status: "alive",
      isYou: false,
      pawns: yardPawns(4),
    },
  ],
  log: [
    { id: "l5", seat: 3, message: "ChainRoller moved a pawn into the home lane." },
    { id: "l4", seat: 2, message: "LudoLegend rolled a 4." },
    { id: "l3", seat: 1, message: "You released a pawn with a 6." },
    { id: "l2", seat: null, message: "Turn 4 started." },
    { id: "l1", seat: 4, message: "GoldGoblin is still stuck in the yard." },
  ],
};

export const MOCK_LUDO_FINISHED: LudoRoomState = {
  ...MOCK_LUDO_ROOM,
  roomId: "LUD-WIN",
  turn: 31,
  turnSecondsLeft: 0,
  activeSeat: 1,
  lastRoll: null,
  players: MOCK_LUDO_ROOM.players.map((player) =>
    player.position === 1
      ? {
          ...player,
          status: "finished",
          pawns: player.pawns.map((pawn, index) => ({
            ...pawn,
            status: "finished" as const,
            steps: 0,
            id: `p1-fin-${index}`,
          })),
        }
      : {
          ...player,
          status: "alive",
          pawns: player.pawns.map((pawn) =>
            pawn.status === "finished"
              ? pawn
              : { ...pawn, status: "yard" as const, steps: 0 },
          ),
        },
  ),
  log: [
    { id: "w1", seat: 1, message: "You finished all four pawns!" },
    { id: "w0", seat: 1, message: "You win the room!" },
    ...MOCK_LUDO_ROOM.log,
  ],
};

export function getLudoRoom(roomId: string): LudoRoomState {
  if (roomId.toUpperCase() === "LUD-WIN") {
    return { ...MOCK_LUDO_FINISHED, roomId };
  }
  return { ...MOCK_LUDO_ROOM, roomId };
}

/**
 * Finished Ludo snapshot · one player has all four pawns home. Browse
 * `/room/LUD-WIN` to review the victory overlay without grinding a full match.
 */
export function ludoPrizePool(state: LudoRoomState) {
  return prizePool({ entryFee: state.entryFee, maxPlayers: state.maxPlayers });
}

export function pawnsFinished(player: LudoPlayer) {
  return player.pawns.filter((pawn) => pawn.status === "finished").length;
}

export function pawnsOnBoard(player: LudoPlayer) {
  return player.pawns.filter(
    (pawn) => pawn.status === "track" || pawn.status === "home",
  ).length;
}
