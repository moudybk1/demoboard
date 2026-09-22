import { shortenAddress } from "@/lib/wallet/chains";

/** USDG entry on Robinhood Chain. Gas for the transfer is still native ETH. */
export const PLAY_ENTRY_FEE = 1;

export const PLAY_ENTRY_AMOUNT = "1";

export const PLAY_STAKE_SYMBOL = "USDG";

/**
 * Sit-fee amounts. Whole USDG stays a whole number; smaller pots keep
 * enough fraction digits to stay distinct. Pixel titles are not used.
 */
export function formatPlayEth(amount: number) {
  const digits = Number.isInteger(amount) ? 0 : Math.abs(amount) >= 1 ? 2 : 3;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 4,
  }).format(amount);
}

const PLAYER_KEY = "board.play.player";

export type PlayPlayer = {
  address: string;
  username: string;
};

export function savePlayPlayer(address: string) {
  if (typeof window === "undefined") return;
  const player: PlayPlayer = {
    address: address.toLowerCase(),
    username: shortenAddress(address),
  };
  try {
    window.sessionStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  } catch {
    // ignore quota / private mode
  }
}

export function readPlayPlayer(): PlayPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayPlayer;
    if (!parsed?.address || !parsed.username) return null;
    return parsed;
  } catch {
    return null;
  }
}
