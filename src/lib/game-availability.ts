import type { GameType } from "@/lib/types";

/** Launch gate shared by the UI and server. Existing paid matches can finish. */
export const GAME_AVAILABILITY: Readonly<Record<GameType, boolean>> = {
  ludo: true,
  monopoly: false,
};

export const DEFAULT_PLAY_GAME: GameType = "ludo";
export const WORK_IN_PROGRESS = "Work in progress";
export const GAME_DISABLED_MESSAGE =
  "Monopoly is a work in progress. New entries and matches are disabled. Play Ludo instead.";

export function isGameEnabled(game: GameType): boolean {
  return GAME_AVAILABILITY[game];
}

export function enabledPlayGame(game: GameType | null): GameType {
  return game && isGameEnabled(game) ? game : DEFAULT_PLAY_GAME;
}
