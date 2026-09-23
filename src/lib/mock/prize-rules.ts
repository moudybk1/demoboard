/**
 * Prize & fee rules for /rules. Numbers: 4× entry pot, 2% protocol fee,
 * winner keeps 98%; fee split 30% development / 70% buyback and burn;
 * DEX fees 20% development / 80% buyback and burn.
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
    buybackAndBurn: number;
  };
};

export const PRIZE_BANNER = "Four players · one prize pool · one winner";

export const PRIZE_RULES_INTRO = {
  title: "Prizes & fees",
  punch: "Simple rules. Transparent fees. One winner.",
  support:
    "Every room brings together four players with the same entry amount. All entries form the match pool, and once the match is settled, the winner receives the remaining reward after the 2% protocol fee.",
};

export const PRIZE_RULES: PrizeRule[] = [
  {
    id: "pool",
    title: "Four players. One pool.",
    body: "Every player enters with the same $USDG amount. All four entries form one match pool.",
    answer: [
      {
        type: "p",
        text: "Every player enters the room with the same required amount of $USDG.",
      },
      {
        type: "p",
        text: "All four entries are combined into one match pool.",
      },
      {
        type: "p",
        text: "For example, if the entry is 10 $USDG:",
      },
      {
        type: "callout",
        text: "10 × 4 players = 40 $USDG gross match pool",
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
          "70% Buyback and Burn. Allocated to $BOARD buybacks and permanently removing $BOARD from circulation.",
        ],
      },
      {
        type: "callout",
        text: "2% Fee → 30% Development · 70% Buyback and Burn",
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
  entryFee: 10,
  seats: 4,
  grossPot: 40,
  feePercent: 2,
  feeAmount: 0.8,
  winnerPayout: 39.2,
  feeSplit: {
    development: 0.24,
    buybackAndBurn: 0.56,
  },
};

export const PRIZE_DEX_FEES = {
  title: "DEX fee allocation",
  punch: "Trading activity also supports the ecosystem.",
  lead: "Fees generated from supported $BOARD DEX trading are allocated across two areas:",
  splits: [
    {
      percent: 20,
      label: "Development",
      body: "Supports continued product development and ecosystem growth.",
    },
    {
      percent: 80,
      label: "Buyback and Burn",
      body: "Allocated to $BOARD buybacks and permanently removing $BOARD from circulation.",
    },
  ],
  formula: "DEX Fees → 20% Development · 80% Buyback and Burn",
} as const;

export const PRIZE_ECOSYSTEM = {
  title: "Two fee streams. One ecosystem.",
  streams: [
    {
      id: "gameplay",
      title: "Gameplay fees",
      body: "30% Development · 70% Buyback and Burn",
    },
    {
      id: "dex",
      title: "DEX fees",
      body: "20% Development · 80% Buyback and Burn",
    },
  ],
  closing:
    "Every game played and every supported trade contributes back to the BOARD ecosystem.",
} as const;

export const PRIZE_CLOSING = {
  title: "Ready to take your seat?",
  support:
    "Connect your wallet, pick a table, and take on three rivals.",
  tagline: "Four players. One room. One winner.",
} as const;

export const PRIZE_CTAS = [
  {
    label: "Play",
    href: "/play",
    variant: "primary" as const,
  },
  { label: "How to play", href: "/how-to", variant: "secondary" as const },
];
