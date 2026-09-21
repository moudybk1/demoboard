import type { GameType } from "@/lib/types";

/**
 * Landing game choice. Stored in the URL and session so a Ludo tap
 * survives the access-code gate and lands on the Ludo lobby.
 */

export const PREVIEW_GAME_KEY = "board.preview.game";

export type PreviewGame = GameType;

export function parsePreviewGame(raw: unknown): PreviewGame | null {
  if (raw === "monopoly" || raw === "ludo") return raw;
  return null;
}

export function rememberPreviewGame(game: PreviewGame) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREVIEW_GAME_KEY, game);
  } catch {
    // ignore blocked storage
  }
}

export function readPreviewGame(): PreviewGame | null {
  if (typeof window === "undefined") return null;
  try {
    return parsePreviewGame(window.sessionStorage.getItem(PREVIEW_GAME_KEY));
  } catch {
    return null;
  }
}

export function playPathForGame(game: PreviewGame): string {
  return `/play?game=${game}`;
}

export function demoPathForGame(game: PreviewGame): string {
  return `/demo?game=${game}`;
}

export function lobbyPathForGame(game: PreviewGame): string {
  return `/lobby?game=${game}`;
}
