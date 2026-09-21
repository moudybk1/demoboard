/**
 * Copy for the dedicated play portal. One world per game, shown as a carousel.
 */

import type { GameType } from "@/lib/types";

export type PlayWorld = {
  id: GameType;
  sign: string;
  punch: string;
  cta: string;
  quote: string;
  seat: number;
};

export const PLAY_WORLDS: readonly PlayWorld[] = [
  {
    id: "monopoly",
    sign: "MONOPOLY",
    punch: "Own the board.",
    cta: "Enter Monopoly",
    quote:
      "Buy the streets, collect the rent, and leave three rivals broke.",
    seat: 1,
  },
  {
    id: "ludo",
    sign: "LUDO",
    punch: "Race for home.",
    cta: "Enter Ludo",
    quote:
      "Sprint every pawn home. Send rivals back. Finish first.",
    seat: 4,
  },
] as const;

