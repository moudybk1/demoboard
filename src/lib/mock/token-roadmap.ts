/**
 * BOARD token facts + economy + product roadmap for welcome/guide surfaces.
 */

export const TOKEN_INFO = {
  symbol: "BOARD",
  chain: "Robinhood Chain",
  role: "BOARD is separate from paid Ludo. Ludo entries, refunds and winner payouts use USDG.",
  feeNote:
    "The operator treasury retains 2% of a settled Ludo pot. No automatic token buyback or burn is implemented.",
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
    title: "Ludo-first testing",
    body: "Server-authoritative Ludo with four paying humans and USDG settlement. Mainnet entry is gated. Monopoly is disabled: Work in progress.",
    status: "live",
  },
  {
    id: "wallet",
    phase: "Next",
    title: "Mainnet release verification",
    body: "Complete four-wallet testnet entry, reconnect, refunds and confirmed payouts; reconcile legacy records and independently review security before enabling mainnet.",
    status: "next",
  },
  {
    id: "season",
    phase: "Later",
    title: "Seasons & leaderboards",
    body: "Planned ranked play and cosmetic boards. These features do not change the current USDG payout rules or promise automatic token burns.",
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
