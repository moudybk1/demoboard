/**
 * Prize & fee rules for /rules. Numbers: 4× entry pot, 2% protocol fee,
 * winner keeps 98%; fee split 30/35/35; DEX fees 50/50.
 */

export type PrizeBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export type PrizeRule = {
  id: string;
  title: string;
  body: string;
  answer: PrizeBlock[];
};

export type FeeExample = {
  entryFee: number;
  seats: number;
  grossPot: number;
  feePercent: number;
  feeAmount: number;
  winnerPayout: number;
  feeSplit: {
    development: number;
    buyback: number;
    burn: number;
  };
};

export const PRIZE_BANNER = "Four players · one prize pool · one winner";

export const PRIZE_RULES_INTRO = {
  title: "Prizes & fees",
  punch: "Simple rules. Transparent fees. One winner.",
  support:
    "Every room brings together four players with the same entry amount. All entries form the match pool, and once the match is settled, the winner receives the remaining reward after the 2% protocol fee. This closed demo does not stake or pay out real $BOARD. The numbers below describe the live economy.",
};

export const PRIZE_RULES: PrizeRule[] = [
  {
    id: "pool",
    title: "Four players. One pool.",
    body: "Every player enters with the same $BOARD amount. All four entries form one match pool.",
    answer: [
      {
        type: "p",
        text: "Every player enters the room with the same required amount of $BOARD.",
      },
      {
        type: "p",
        text: "All four entries are combined into one match pool.",
      },
      {
        type: "p",
        text: "For example, if the entry is 1,000 $BOARD:",
      },
      {
        type: "callout",
        text: "1,000 × 4 players = 4,000 $BOARD gross match pool",
      },
    ],
  },
  {
    id: "winner",
    title: "One winner takes the reward.",
    body: "Every room ends with a single winner. No runner-up splits.",
    answer: [
      { type: "p", text: "Every room ends with a single winner." },
      {
        type: "p",
        text: "There are no runner-up splits. Whether you're building your property empire or racing your pawns home, the goal stays the same:",
      },
      { type: "callout", text: "Outplay the other three. Finish on top." },
    ],
  },
  {
    id: "fee",
    title: "2% protocol fee",
    body: "A 2% protocol fee is applied when the match is settled. The winner receives 98%.",
    answer: [
      {
        type: "p",
        text: "A 2% protocol fee is applied when the match is settled.",
      },
      {
        type: "p",
        text: "The remaining 98% of the match pool goes to the winner.",
      },
      {
        type: "p",
        text: "The protocol fee is allocated back into the BOARD ecosystem:",
      },
      {
        type: "list",
        items: [
          "30% Development. Supports ongoing game development, infrastructure, operations, and future features.",
          "35% Buyback. Allocated to $BOARD buybacks.",
          "35% Burn. Allocated to permanently removing $BOARD from circulation.",
        ],
      },
      {
        type: "callout",
        text: "2% Fee → 30% Build · 35% Buyback · 35% Burn",
      },
    ],
  },
  {
    id: "settle",
    title: "Clear settlement",
    body: "Before joining, review entry, pool, fee, and potential winner reward.",
    answer: [
      {
        type: "p",
        text: "Once the match ends and the result is confirmed, the final reward is settled according to the room rules.",
      },
      {
        type: "p",
        text: "Before joining, players can review the entry amount, gross pool, protocol fee, and potential winner reward.",
      },
      { type: "callout", text: "Know the numbers before you roll." },
    ],
  },
];

export const FEE_EXAMPLE: FeeExample = {
  entryFee: 1_000,
  seats: 4,
  grossPot: 4_000,
  feePercent: 2,
  feeAmount: 80,
  winnerPayout: 3_920,
  feeSplit: {
    development: 24,
    buyback: 28,
    burn: 28,
  },
};

export const PRIZE_DEX_FEES = {
  title: "DEX fee allocation",
  punch: "Trading activity also supports the ecosystem.",
  lead: "Fees generated from supported $BOARD DEX trading are allocated across two areas:",
  splits: [
    {
      percent: 50,
      label: "Development",
      body: "Supports continued product development and ecosystem growth.",
    },
    {
      percent: 50,
      label: "Buyback",
      body: "Allocated to $BOARD buybacks.",
    },
  ],
  formula: "DEX Fees → 50% Development · 50% Buyback",
} as const;

export const PRIZE_ECOSYSTEM = {
  title: "Two fee streams. One ecosystem.",
  streams: [
    {
      id: "gameplay",
      title: "Gameplay fees",
      body: "30% Development · 35% Buyback · 35% Burn",
    },
    {
      id: "dex",
      title: "DEX fees",
      body: "50% Development · 50% Buyback",
    },
  ],
  closing:
    "Every game played and every supported trade contributes back to the BOARD ecosystem.",
} as const;

export const PRIZE_CLOSING = {
  title: "Ready to take your seat?",
  support:
    "Connect your wallet when it goes live, pick a table, and take on three rivals.",
  tagline: "Four players. One room. One winner.",
} as const;

export const PRIZE_CTAS = [
  {
    label: "Connect Wallet",
    href: "#connect-wallet",
    variant: "primary" as const,
  },
  { label: "How to play", href: "/how-to", variant: "secondary" as const },
];
