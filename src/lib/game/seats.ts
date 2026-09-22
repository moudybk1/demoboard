/**
 * Seat identity is shared by every game surface so seat colours stay consistent.
 */

export type SeatColor = {
  /** Tailwind background utility for filled swatches and pawns. */
  bg: string;
  /** Tailwind text utility for names and cash figures. */
  text: string;
  /** Tailwind border utility for the active-turn frame. */
  border: string;
  /** Raw hex, needed where colour goes into sprite data or SVG fills. */
  hex: string;
  /** Shading hex for pawn outlines. */
  shadeHex: string;
  label: string;
};

export const SEAT_COLORS: readonly SeatColor[] = [
  {
    bg: "bg-[#22a84a]",
    text: "text-[#22a84a]",
    border: "border-[#22a84a]",
    hex: "#22a84a",
    shadeHex: "#146b2e",
    label: "Green",
  },
  {
    bg: "bg-[#e23b3b]",
    text: "text-[#e23b3b]",
    border: "border-[#e23b3b]",
    hex: "#e23b3b",
    shadeHex: "#9b1c1c",
    label: "Red",
  },
  {
    bg: "bg-[#2f6fe4]",
    text: "text-[#2f6fe4]",
    border: "border-[#2f6fe4]",
    hex: "#2f6fe4",
    shadeHex: "#1a3f8f",
    label: "Blue",
  },
  {
    bg: "bg-[#f5c518]",
    text: "text-[#f5c518]",
    border: "border-[#f5c518]",
    hex: "#f5c518",
    shadeHex: "#a67c00",
    label: "Yellow",
  },
];

/** Seats are 1-indexed at the table; the palette is 0-indexed. */
export function seatColor(position: number): SeatColor {
  return SEAT_COLORS[(position - 1) % SEAT_COLORS.length];
}
