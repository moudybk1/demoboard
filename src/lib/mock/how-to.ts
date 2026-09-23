/**
 * Numbered how-to-play copy for /how-to.
 */

export type HowToBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export type HowToStep = {
  id: string;
  number: number;
  /** Short label shown in the step chip / stage preview. */
  label: string;
  title: string;
  body: string;
  answer: HowToBlock[];
};

export const HOW_TO_BANNER =
  "Pick a board · enter a room · start the rivalry";

export const HOW_TO_INTRO = {
  title: "How to play",
  punch: "Five steps. Four players. One winner.",
  support:
    "Choose your game, connect your wallet, enter a room, and compete until one winner remains.",
};

export const HOW_TO_STEPS: HowToStep[] = [
  {
    id: "wallet",
    number: 1,
    label: "Connect your wallet",
    title: "Connect your wallet",
    body: "Connect a supported wallet to hold $USDG and enter rooms.",
    answer: [
      {
        type: "p",
        text: "Connect a supported wallet and make sure you have enough $USDG for the room you want to enter.",
      },
      {
        type: "p",
        text: "Use Sign in in the header to connect and verify ownership of your wallet.",
      },
      {
        type: "callout",
        text: "Your wallet stays in your control. We will never ask for your private key or seed phrase.",
      },
    ],
  },
  {
    id: "choose",
    number: 2,
    label: "Choose your game",
    title: "Pick your battlefield",
    body: "Build your property empire or race your pawns home. Two games. Two ways to win.",
    answer: [
      { type: "p", text: "Choose how you want to compete." },
      {
        type: "p",
        text: "Build your property empire and outlast your rivals, or race your pawns home while sending opponents back.",
      },
      { type: "callout", text: "Two games. Two ways to win." },
    ],
  },
  {
    id: "room",
    number: 3,
    label: "Choose a room",
    title: "Find your room",
    body: "Pick a room based on its entry amount and join three other players.",
    answer: [
      {
        type: "p",
        text: "Pick a room based on its entry amount and join three other players.",
      },
      {
        type: "p",
        text: "Review the entry, prize pool, and applicable fee before confirming your spot.",
      },
      { type: "callout", text: "Four players. One room. One winner." },
    ],
  },
  {
    id: "moves",
    number: 4,
    label: "Make your moves",
    title: "Roll. Move. Outplay.",
    body: "Every player follows the same rules and randomness system. Your strategy is yours. The dice aren't.",
    answer: [
      {
        type: "p",
        text: "Once the match begins, every player follows the same rules and randomness system.",
      },
      {
        type: "list",
        items: [
          "Property Battle: Buy properties, collect rent, build your position, and survive the board.",
          "Ludo: Move your pawns, capture your rivals, and race home before everyone else.",
        ],
      },
      { type: "callout", text: "Your strategy is yours. The dice aren't." },
    ],
  },
  {
    id: "win",
    number: 5,
    label: "Take the win",
    title: "Finish on top",
    body: "Every room has one winner. After the 2% protocol fee, the winner takes the rest.",
    answer: [
      { type: "p", text: "Every room has one winner." },
      {
        type: "p",
        text: "Once the match is settled, the winner receives the remaining match pool after the applicable 2% protocol fee.",
      },
      {
        type: "callout",
        text: "Win the board. Take the reward. Start another rivalry.",
      },
    ],
  },
];

export const HOW_TO_FEE = {
  title: "Every match moves BOARD forward.",
  lead: "Each game entry carries a 2% protocol fee, allocated across the BOARD ecosystem:",
  splits: [
    {
      percent: 30,
      label: "Development",
      body: "Supports ongoing development, infrastructure, operations, and future features.",
    },
    {
      percent: 70,
      label: "Buyback and Burn",
      body: "Allocated to $BOARD buybacks and permanently removing $BOARD from circulation.",
    },
  ],
  formula: "2% Fee → 30% Development · 70% Buyback and Burn",
} as const;

export const HOW_TO_CLOSING = {
  title: "Ready to enter the board?",
  support:
    "Connect your wallet, pick a table, and take on three rivals.",
  cta: "Play",
  href: "/play",
  tagline: "Same memories. Different stakes.",
} as const;

/** Kept for guide API compatibility with older planned-live copy. */
export const HOW_TO_PLANNED: HowToStep[] = [];

export const HOW_TO_CTAS = [
  {
    label: "Play",
    href: "/play",
    variant: "primary" as const,
  },
  { label: "Prizes & fees", href: "/rules", variant: "secondary" as const },
];
