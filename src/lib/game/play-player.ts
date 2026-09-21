import { shortenAddress } from "@/lib/wallet/chains";

/** Native ETH sit fee on Robinhood Chain Testnet. */
export const PLAY_ENTRY_FEE = 0.002;

export const PLAY_ENTRY_FEE_ETH = "0.002";

export const PLAY_STAKE_SYMBOL = "ETH";

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
