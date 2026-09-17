/**
 * Mock BOARD token facts + product roadmap for the welcome/guide surface.
 */

export const TOKEN_INFO = {
  symbol: "BOARD",
  chain: "Robinhood Chain",
  role: "Entry fees, in room stakes, and winner payouts all move in BOARD.",
  feeNote:
    "A 2% prize fee funds the treasury and burns supply on every settled room.",
};

export type RoadmapItem = {
  id: string;
  phase: string;
  title: string;
  body: string;
  status: "live" | "next" | "later";
};

export const ROADMAP: RoadmapItem[] = [
  {
    id: "tables",
    phase: "Now",
    title: "Closed demo tables",
    body: "Monopoly with country landmarks and Ludo with capture races. Four seats, sample pots, no live stake.",
    status: "live",
  },
  {
    id: "wallet",
    phase: "Next",
    title: "Deposit & withdraw",
    body: "Fund a real BOARD balance, cash out winnings, and see every move in transaction history.",
    status: "next",
  },
  {
    id: "season",
    phase: "Later",
    title: "Seasons & leaderboards",
    body: "Ranked pots, cosmetic boards, and seasonal burns tied to the same 2% fee loop.",
    status: "later",
  },
];
