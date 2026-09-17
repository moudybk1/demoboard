/**
 * Numbered how-to-play copy for /how-to.
 */

export type HowToStep = {
  id: string;
  number: number;
  title: string;
  body: string;
};

export const HOW_TO_INTRO = {
  title: "How to play",
  support:
    "This closed demo lets you try Monopoly and Ludo with sample balances. Staking and payouts are not live yet.",
};

export const HOW_TO_STEPS: HowToStep[] = [
  {
    id: "code",
    number: 1,
    title: "Enter your invitation code",
    body: "Open Enter demo and type the code from the project link. The form shows a loading state, then takes you to the lobby.",
  },
  {
    id: "choose",
    number: 2,
    title: "Choose a game",
    body: "Pick Monopoly or Ludo. Your choice is remembered so the lobby opens on that table.",
  },
  {
    id: "join",
    number: 3,
    title: "Join a sample table",
    body: "Sit in a four-player room with sample pots. Nothing here deposits or pays out BOARD.",
  },
  {
    id: "play",
    number: 4,
    title: "Learn the turn controls",
    body: "Monopoly: roll, buy streets, collect rent. Ludo: roll, move pawns, capture rivals, race home.",
  },
  {
    id: "end",
    number: 5,
    title: "Understand how the game ends",
    body: "One winner per room. In the live game that winner will keep 98% of the pot. Here the round is a sample only.",
  },
];

export const HOW_TO_PLANNED: HowToStep[] = [
  {
    id: "deposit",
    number: 1,
    title: "Deposit BOARD tokens",
    body: "When staking is live, Wallet will fund a real balance on Robinhood Chain before you sit.",
  },
  {
    id: "fee",
    number: 2,
    title: "Entry fees and the 2% cut",
    body: "Four entry fees fill one pot. The winner keeps 98%. The 2% slice funds treasury and burn.",
  },
  {
    id: "withdraw",
    number: 3,
    title: "Withdraw winnings",
    body: "Cash out BOARD from Wallet. Transaction history will show every deposit, entry, and payout.",
  },
];

export const HOW_TO_CTAS = [
  { label: "Enter demo", href: "/demo", variant: "primary" as const },
  { label: "Prizes and fees", href: "/rules", variant: "secondary" as const },
];
