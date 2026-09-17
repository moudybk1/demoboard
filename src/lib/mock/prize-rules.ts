/**
 * Prize & fee rules mock · used by /rules (guide). Numbers mirror the PRD:
 * 4× entry fee pot, 2% fee to treasury + burn, winner keeps 98%.
 */

export type FeeExample = {
  entryFee: number;
  seats: number;
  grossPot: number;
  feePercent: number;
  feeAmount: number;
  winnerPayout: number;
};

export const PRIZE_RULES_INTRO = {
  title: "Prizes and fees",
  support:
    "Every room pools the same entry fee from four players. One winner takes the pot after a flat platform fee.",
};

export const PRIZE_RULES = [
  {
    id: "pot",
    title: "The pot",
    body: "When you join, your entry fee goes into the room pot. Four seats mean four identical fees · if the fee is 1,000 BOARD, the pot is 4,000 BOARD before fees.",
  },
  {
    id: "winner",
    title: "One winner",
    body: "Only the room winner is paid. There are no runner up splits. Monopoly and Ludo both settle to a single crown.",
  },
  {
    id: "fee",
    title: "2% platform fee",
    body: "On payout, 2% of the pot is charged. That slice funds the project treasury and burns BOARD supply. The winner receives 98%.",
  },
  {
    id: "settle",
    title: "Settlement",
    body: "Payout credits your platform balance automatically when the room settles. Withdraw to your wallet whenever you are ready.",
  },
] as const;

export const FEE_EXAMPLE: FeeExample = {
  entryFee: 1_000,
  seats: 4,
  grossPot: 4_000,
  feePercent: 2,
  feeAmount: 80,
  winnerPayout: 3_920,
};

export const PRIZE_CTAS = [
  { label: "Open lobby", href: "/lobby", variant: "primary" as const },
  { label: "How to play", href: "/how-to", variant: "secondary" as const },
];
