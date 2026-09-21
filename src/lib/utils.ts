import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * BOARD token amounts. Fees produce fractions (2% of 4,050 is 81), so
 * decimals are shown only when the value actually has them · a balance of
 * 12,450 should never read "12,450.00".
 */
export function formatBoard(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount);
}

/** Compact form for tight spots like nav chips, e.g. 12500 -> "12.5K". */
export function formatBoardCompact(amount: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Short "how long ago" label, e.g. "2m ago". `now` is passed in rather than
 * read from the clock so server and client renders agree.
 */
export function formatAge(iso: string, now: number) {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}
