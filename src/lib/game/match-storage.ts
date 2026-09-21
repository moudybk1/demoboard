import { asPlayState, createFreshMonopolyMatch, createMonopolyMatchForSeats, type MonopolyPlayState } from "@/lib/game/monopoly-rules";
import { createFreshLudoMatch, createLudoMatchForSeats, type LudoRoomState } from "@/lib/mock/ludo";
import { readPlayPlayer } from "@/lib/game/play-player";
import type { PlayTableSeatView } from "@/lib/game/play-table";

const MONO_KEY = (roomId: string) => `board.match.monopoly.${roomId}`;
const LUDO_KEY = (roomId: string) => `board.match.ludo.${roomId}`;

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

function markYou<T extends { id: string; isYou: boolean }>(
  players: T[],
  viewerId: string | null,
): T[] {
  if (!viewerId) return players;
  const needle = viewerId.toLowerCase();
  return players.map((player) => ({
    ...player,
    isYou: player.id.toLowerCase() === needle,
  }));
}

function asMatchSeats(seats: PlayTableSeatView[]) {
  return seats.map((seat) => ({
    id: seat.address,
    username: seat.username,
    seat: seat.seat,
  }));
}

function rosterMatches(
  seats: PlayTableSeatView[],
  players: Array<{ id: string }>,
) {
  if (players.length !== seats.length) return false;
  const seated = new Set(seats.map((seat) => seat.address.toLowerCase()));
  return players.every((player) => seated.has(player.id.toLowerCase()));
}

export function loadOrCreateMonopoly(roomId: string): MonopolyPlayState {
  const stored = readJson<MonopolyPlayState>(MONO_KEY(roomId));
  if (stored?.players?.length) return asPlayState(stored);
  const you = readPlayPlayer();
  const fresh = createFreshMonopolyMatch(
    roomId,
    you ? { id: you.address, username: you.username } : undefined,
  );
  writeJson(MONO_KEY(roomId), fresh);
  return fresh;
}

export function loadMonopolyForTable(
  roomId: string,
  seats: PlayTableSeatView[],
  viewerId: string | null,
): MonopolyPlayState {
  const stored = readJson<MonopolyPlayState>(MONO_KEY(roomId));
  if (stored?.players && rosterMatches(seats, stored.players)) {
    return asPlayState({
      ...stored,
      players: markYou(stored.players, viewerId),
    });
  }
  const fresh = createMonopolyMatchForSeats(roomId, asMatchSeats(seats));
  const marked = {
    ...fresh,
    players: markYou(fresh.players, viewerId),
  };
  writeJson(MONO_KEY(roomId), marked);
  return marked;
}

export function saveMonopoly(state: MonopolyPlayState) {
  writeJson(MONO_KEY(state.roomId), state);
}

export function loadOrCreateLudo(roomId: string): LudoRoomState {
  const stored = readJson<LudoRoomState>(LUDO_KEY(roomId));
  if (stored?.players?.length) return stored;
  const you = readPlayPlayer();
  const fresh = createFreshLudoMatch(
    roomId,
    you ? { id: you.address, username: you.username } : undefined,
  );
  writeJson(LUDO_KEY(roomId), fresh);
  return fresh;
}

export function loadLudoForTable(
  roomId: string,
  seats: PlayTableSeatView[],
  viewerId: string | null,
): LudoRoomState {
  const stored = readJson<LudoRoomState>(LUDO_KEY(roomId));
  if (stored?.players && rosterMatches(seats, stored.players)) {
    return { ...stored, players: markYou(stored.players, viewerId) };
  }
  const fresh = createLudoMatchForSeats(roomId, asMatchSeats(seats));
  const marked = {
    ...fresh,
    players: markYou(fresh.players, viewerId),
  };
  writeJson(LUDO_KEY(roomId), marked);
  return marked;
}

export function saveLudo(state: LudoRoomState) {
  writeJson(LUDO_KEY(state.roomId), state);
}

export function newMatchRoomId(game: "monopoly" | "ludo") {
  const prefix = game === "ludo" ? "LUD" : "MNP";
  const stamp = Date.now().toString(36).slice(-6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}
