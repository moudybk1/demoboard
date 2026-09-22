import type { PixelSprite } from "@/lib/game/pixel-sprite";
import { seatColor } from "@/lib/game/seats";

/**
 * Distinct silhouettes per seat so pieces stay readable by shape, not
 * colour alone (colour-blind friendly + premium board-game feel).
 *
 * Palette: `c` fill · `d` shade · `o` outline · `h` highlight
 * Seats: green · red · blue · yellow.
 */

const SHAPES: Record<number, string[]> = {
  /** Seat 1 · classic pawn */
  1: [
    "..oooo..",
    ".occcco.",
    ".occccdo",
    "..occdo.",
    "..ochdo.",
    ".occccdo",
    "occccccd",
    ".oddddo.",
  ],
  /** Seat 2 · knight helm */
  2: [
    "...ooo..",
    "..occho.",
    ".occccdo",
    "occhccdo",
    ".occccdo",
    "..occdo.",
    ".occccdo",
    "oodddddo",
  ],
  /** Seat 3 · tower / rook */
  3: [
    "o.o.o.o.",
    "occhccdo",
    ".occccdo",
    ".occccdo",
    ".ochhcdo",
    ".occccdo",
    "occccccd",
    "oddddddo",
  ],
  /** Seat 4 · star crest */
  4: [
    "...oo...",
    "..occo..",
    "oocchcoo",
    ".occccdo",
    "..ochdo.",
    ".occccdo",
    "occccccd",
    ".oddddo.",
  ],
};

const spriteCache = new Map<number, PixelSprite>();

/** Builds a seat-tinted pawn sprite with a unique silhouette. */
export function pawnSprite(seat: number): PixelSprite {
  const index = ((seat - 1) % 4) + 1;
  const cached = spriteCache.get(index);
  if (cached) return cached;
  const color = seatColor(index);
  const rows = SHAPES[index] ?? SHAPES[1];
  const sprite: PixelSprite = {
    palette: {
      c: color.hex,
      d: color.shadeHex,
      o: "#07090f",
      h: "#f2f4fb",
    },
    rows,
  };
  spriteCache.set(index, sprite);
  return sprite;
}

/** Alias for Ludo surfaces · same green / red / blue / yellow paint. */
export function ludoPawnSprite(seat: number): PixelSprite {
  return pawnSprite(seat);
}

/** Short glyph used on yard badges and player rails. */
export const PAWN_GLYPHS = ["♟", "♞", "♜", "★"] as const;

export function pawnGlyph(seat: number) {
  return PAWN_GLYPHS[(seat - 1) % PAWN_GLYPHS.length];
}
