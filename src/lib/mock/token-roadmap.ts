/**
 * BOARD token facts + economy + product roadmap for welcome/guide surfaces.
 */

export const TOKEN_INFO = {
  symbol: "BOARD",
  chain: "Robinhood Chain",
  role: "BOARD is separate from paid Ludo. Ludo entries, refunds and winner payouts use native ETH.",
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
    body: "Server-authoritative Ludo with four paying humans and native ETH settlement. Mainnet entry is gated. Monopoly is disabled: Work in progress.",
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
    body: "Planned ranked play and cosmetic boards. These features do not change the current ETH payout rules or promise automatic token burns.",
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
  eyebrow: "Ludo payments",
  title: "Know where your entry goes.",
  lead: "Paid Ludo requires four paying humans. Entries and payouts use native ETH, not the BOARD token.",
  closing:
    "Refunds return the full entry amount. Players pay entry gas; the operator pays refund and payout gas separately.",
  lanes: [
    {
      id: "gameplay",
      title: "Paid Ludo pot",
      body: "Four 0.002 ETH entries form a 0.008 ETH pot. The winner receives 0.00784 ETH; the treasury retains 0.00016 ETH.",
      splits: [
        { label: "Winner", percent: 98 },
        { label: "Treasury", percent: 2 },
      ],
    },
    {
      id: "dex",
      title: "Custody and settlement",
      body: "Entries go to an operator-controlled treasury, not a game escrow contract. Payouts need a successful transaction receipt. Automatic buybacks and burns are not implemented.",
      splits: [],
    },
  ] satisfies EconomyLane[],
} as const;
