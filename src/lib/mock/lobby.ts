import {
  MAX_PLAYERS_PER_ROOM,
  type GameType,
  type Room,
  type RoomPlayer,
  type WalletBalance,
} from "@/lib/types";

/**
 * Stand-in lobby data. The backend phase replaces these readers with real API
 * calls; until then the shapes here are the contract the UI is built against.
 */

export type GameOption = {
  type: GameType;
  name: string;
  tagline: string;
  description: string;
  /** Emoji placeholder until the pixel sprite sheets land. */
  glyph: string;
  activePlayers: number;
  openRooms: number;
};

export const GAME_OPTIONS: GameOption[] = [
  {
    type: "monopoly",
    name: "Monopoly",
    tagline: "Own the world, one country at a time",
    description:
      "Roll, buy countries, and collect rent until your last rival goes bankrupt.",
    glyph: "🏛️",
    activePlayers: 4,
    openRooms: 1,
  },
  {
    type: "ludo",
    name: "Ludo",
    tagline: "Race home, knock them back",
    description:
      "Sprint all four pawns to the finish line and send your rivals back to start.",
    glyph: "🎲",
    activePlayers: 4,
    openRooms: 1,
  },
];

/**
 * Entry-fee tiers offered in the lobby, in $USDG. The top tier sits
 * above the mock balance on purpose so the "not enough balance" state on the
 * join button is reachable while the backend is still stubbed.
 */
export const ENTRY_FEE_TIERS = [
  100, 500, 1_000, 5_000, 10_000, 50_000,
] as const;

const ROSTER: Omit<RoomPlayer, "position" | "status">[] = [
  { id: "u_01", username: "PixelBaron", avatarUrl: null },
  { id: "u_02", username: "DiceDuchess", avatarUrl: null },
  { id: "u_03", username: "RentSeeker", avatarUrl: null },
  { id: "u_04", username: "LudoLegend", avatarUrl: null },
  { id: "u_05", username: "TokyoTycoon", avatarUrl: null },
  { id: "u_06", username: "NileNomad", avatarUrl: null },
  { id: "u_07", username: "ChainRoller", avatarUrl: null },
  { id: "u_08", username: "BoardWalker", avatarUrl: null },
  { id: "u_09", username: "SaltySeven", avatarUrl: null },
  { id: "u_10", username: "GoldGoblin", avatarUrl: null },
];

function seatPlayers(count: number, offset: number): RoomPlayer[] {
  return Array.from({ length: count }, (_, index) => {
    const member = ROSTER[(offset + index) % ROSTER.length];
    return { ...member, position: index + 1, status: "alive" };
  });
}

type RoomSeed = {
  id: string;
  gameType: GameType;
  entryFee: number;
  filled: number;
  status: Room["status"];
  minutesAgo: number;
};

const ROOM_SEEDS: RoomSeed[] = [
  { id: "MNP-8842", gameType: "monopoly", entryFee: 1_000, filled: 3, status: "waiting", minutesAgo: 2 },
  { id: "MNP-8839", gameType: "monopoly", entryFee: 100, filled: 1, status: "waiting", minutesAgo: 5 },
  { id: "MNP-8830", gameType: "monopoly", entryFee: 5_000, filled: 2, status: "waiting", minutesAgo: 8 },
  { id: "MNP-8824", gameType: "monopoly", entryFee: 10_000, filled: 3, status: "waiting", minutesAgo: 12 },
  { id: "MNP-8819", gameType: "monopoly", entryFee: 50_000, filled: 2, status: "waiting", minutesAgo: 16 },
  { id: "MNP-8811", gameType: "monopoly", entryFee: 500, filled: 4, status: "playing", minutesAgo: 19 },
  { id: "MNP-8802", gameType: "monopoly", entryFee: 1_000, filled: 4, status: "playing", minutesAgo: 26 },
  { id: "LUD-4471", gameType: "ludo", entryFee: 500, filled: 2, status: "waiting", minutesAgo: 1 },
  { id: "LUD-4468", gameType: "ludo", entryFee: 1_000, filled: 3, status: "waiting", minutesAgo: 4 },
  { id: "LUD-4455", gameType: "ludo", entryFee: 100, filled: 2, status: "waiting", minutesAgo: 9 },
  { id: "LUD-4440", gameType: "ludo", entryFee: 10_000, filled: 1, status: "waiting", minutesAgo: 15 },
  { id: "LUD-4436", gameType: "ludo", entryFee: 50_000, filled: 3, status: "waiting", minutesAgo: 18 },
  { id: "LUD-4432", gameType: "ludo", entryFee: 5_000, filled: 4, status: "playing", minutesAgo: 22 },
];

/** Fixed epoch so server and client renders agree · no hydration drift. */
export const MOCK_NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

export const MOCK_ROOMS: Room[] = ROOM_SEEDS.map((seed, index) => ({
  id: seed.id,
  gameType: seed.gameType,
  entryFee: seed.entryFee,
  maxPlayers: MAX_PLAYERS_PER_ROOM,
  status: seed.status,
  players: seatPlayers(seed.filled, index * 2),
  createdAt: new Date(MOCK_NOW - seed.minutesAgo * 60_000).toISOString(),
}));

export const MOCK_BALANCE: WalletBalance = {
  available: 12_450,
  locked: 1_000,
  chain: "Robinhood Chain",
  address: "0x7A3f9C21bE04dD5e8f1A2b6C09Ee4471D8b3F5a2",
};

export const MOCK_PLAYER = {
  id: "u_me",
  username: "Yoga",
  avatarUrl: null,
};

export function getRoomsByGame(gameType: GameType) {
  return MOCK_ROOMS.filter((room) => room.gameType === gameType);
}

export function getGameOption(gameType: GameType) {
  const option = GAME_OPTIONS.find((game) => game.type === gameType);
  if (!option) throw new Error(`Unknown game type: ${gameType}`);
  return option;
}
