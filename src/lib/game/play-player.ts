import { shortenAddress } from "@/lib/wallet/chains";

/** Native ETH sit fee on Robinhood Chain Testnet. */
export const PLAY_ENTRY_FEE = 0.002;

export const PLAY_ENTRY_FEE_ETH = "0.002";

export const PLAY_STAKE_SYMBOL = "ETH";

/**
 * Sit-fee ETH amounts. Always keeps enough fraction digits that 0.002 and
 * 0.008 stay distinct — pixel titles are not used for this string.
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
