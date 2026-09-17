/**
 * Public community destinations for the header LINKS dropdown.
 * Override with NEXT_PUBLIC_X_URL, NEXT_PUBLIC_TELEGRAM_URL, and
 * NEXT_PUBLIC_DEXSCREENER_URL when the live accounts are ready.
 */

import { getBoardTokenAddress } from "@/lib/wallet/chains";

export type CommunityLinkId = "x" | "telegram" | "dexscreener";

export type CommunityLink = {
  id: CommunityLinkId;
  label: string;
  href: string;
};

function readHttpUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return fallback;
  return raw.replace(/\/$/, "");
}

function dexscreenerHref() {
  const override = readHttpUrl(process.env.NEXT_PUBLIC_DEXSCREENER_URL, "");
  if (override) return override;
  const ca = getBoardTokenAddress();
  if (ca) return `https://dexscreener.com/search?q=${ca}`;
  return "https://dexscreener.com";
}

export const COMMUNITY_LINKS: readonly CommunityLink[] = [
  {
    id: "x",
    label: "X",
    href: readHttpUrl(process.env.NEXT_PUBLIC_X_URL, "https://x.com"),
  },
  {
    id: "telegram",
    label: "Telegram",
    href: readHttpUrl(process.env.NEXT_PUBLIC_TELEGRAM_URL, "https://t.me"),
  },
  {
    id: "dexscreener",
    label: "Dexscreener",
    href: dexscreenerHref(),
  },
];
