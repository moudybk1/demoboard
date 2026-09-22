/**
 * BOARD token facts + economy + product roadmap for welcome/guide surfaces.
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
    body: "Monopoly with country landmarks and Ludo with capture races. Four seats, demo pots, no live stake.",
    status: "live",
  },
  {
    id: "wallet",
    phase: "Next",
    title: "Wallet connection & deposits",
    body: "Connect a wallet, fund a real BOARD balance, and cash out winnings. Wallet connection is coming soon and is not available in this demo.",
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

export type FeeSplit = {
  label: string;
  percent: number;
};

export type EconomyLane = {
  id: string;
  title: string;
  body: string;
  splits: FeeSplit[];
};

export const TOKEN_ECONOMY = {
  eyebrow: "Token economy",
  title: "Play. Trade. Build the ecosystem.",
  lead: "BOARD's fee structure is designed to support continued development while creating ongoing utility for the token.",
  closing:
    "Every game played and every trade contributes back to the BOARD ecosystem.",
  lanes: [
    {
      id: "gameplay",
      title: "Gameplay",
      body: "Every game entry carries a 2% protocol fee.",
      splits: [
        { label: "Development", percent: 30 },
        { label: "Buyback and Burn", percent: 70 },
      ],
    },
    {
      id: "dex",
      title: "DEX trading",
      body: "Fees generated from BOARD trading on supported DEXs are allocated back into the ecosystem.",
      splits: [
        { label: "Development", percent: 50 },
        { label: "Buyback", percent: 50 },
      ],
    },
  ] satisfies EconomyLane[],
} as const;
