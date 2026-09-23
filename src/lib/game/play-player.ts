import { shortenAddress } from "@/lib/wallet/chains";

/** Table entry fee amount shown in the lobby and sit flow. */
export const PLAY_ENTRY_FEE = 0.002;

/** Wire amount string used by the sit transfer path. */
export const PLAY_ENTRY_FEE_ETH = "0.002";

/** Stake ticker for paid table entry, pots, and payouts. */
export const PLAY_STAKE_SYMBOL = "USDG";

/**
 * Format a sit-fee amount. Keeps enough fraction digits that 0.002 and
 * 0.008 stay distinct. Pixel titles are not used for this string.
 */
export function formatPlayEth(amount: number) {
  const digits = Math.abs(amount) >= 1 ? 2 : 3;
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
