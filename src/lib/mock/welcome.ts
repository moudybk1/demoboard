/**
 * Mock copy for the welcome / landing surface.
 */

import { COMMUNITY_LINKS } from "@/lib/community-links";

export type WelcomeCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
  external?: boolean;
  /** Opens the wallet coming-soon dialog instead of navigating. */
  action?: "connect-wallet";
};

const BUY_BOARD_HREF =
  COMMUNITY_LINKS.find((link) => link.id === "dexscreener")?.href ??
  "https://dexscreener.com";

export type WelcomeHighlight = {
  id: string;
  title: string;
  body: string;
};

export const WELCOME_HERO = {
  brand: "BOARD",
  eyebrow: "Four-player tables · live now",
  headline: "Relive your childhood. Play it differently.",
  support:
    "The board games you grew up with, reimagined as competitive four-player PvP.",
  ctas: [
    {
      label: "Play now",
      href: "/play",
      variant: "primary",
    },
    {
      label: "Buy $BOARD",
      href: BUY_BOARD_HREF,
      variant: "secondary",
      external: true,
    },
  ] as WelcomeCta[],
};

export const WELCOME_GAMES = [
  {
    id: "monopoly" as const,
    title: "Monopoly / Property Game",
    punch: "Own the board.",
    cta: "Enter Monopoly",
    closeup:
      "Buy properties, collect rent, and build an empire strong enough to outlast your rivals.",
  },
  {
    id: "ludo" as const,
    title: "Ludo",
    punch: "Race for home.",
    cta: "Enter Ludo",
    closeup:
      "Move fast, send rivals back, and get your pawns across the finish before anyone else.",
  },
] as const;

export const WELCOME_HIGHLIGHTS: WelcomeHighlight[] = [
  {
    id: "wallet",
    title: "Do I need a wallet?",
    body: "Not to play. Sit a table now. Wallet connection is for staking when that ships.",
  },
  {
    id: "includes",
    title: "What can I play?",
    body: "Full Monopoly and Ludo matches. You plus three rivals. Last standing / first home wins the pot.",
  },
  {
    id: "code",
    title: "How do I start?",
    body: "Tap Play, pick Monopoly or Ludo, and the match begins. No access code.",
  },
];

export const WELCOME_LIVE_PULSE = {
  openRooms: 11,
  playersOnline: 2_226,
  potToday: 184_500,
};

/** Honest facts for the public closed-demo landing. Not live occupancy. */
export const DEMO_FACTS = [
  { label: "Games", value: "2" },
  { label: "Seats", value: "4" },
  { label: "Fee", value: "2%" },
] as const;

export type OnboardingStepStatus = "done" | "current" | "upcoming";

export type OnboardingStep = {
  id: string;
  index: number;
  title: string;
  body: string;
  status: OnboardingStepStatus;
  href?: string;
};

/** Compact path under the hero modes. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "deposit",
    index: 1,
    title: "Pick a game",
    body: "Monopoly or Ludo. Four seats, one winner.",
    status: "upcoming",
    href: "/play",
  },
  {
    id: "lobby",
    index: 2,
    title: "Sit the table",
    body: "You plus three rivals. Match starts immediately.",
    status: "upcoming",
    href: "/play",
  },
  {
    id: "win",
    index: 3,
    title: "Crown the board",
    body: "Last standing in Monopoly, first home in Ludo.",
    status: "upcoming",
    href: "/play",
  },
];

export const ONBOARDING_ACTIONS: WelcomeCta[] = [
  { label: "Play now", href: "/play", variant: "primary" },
];

/**
 * Authorship notes grounded in shipped product decisions.
 * Do not invent metrics, testimonials, or unverified history.
 */
export const INSIDE_BOARD = {
  eyebrow: "About BOARD",
  title: "Old memories. New rivalries.",
  lead: "BOARD brings back the games we grew up with and gives them a new way to play. Familiar boards, familiar moments, but now built around four-player PvP where every move matters and only one player comes out on top.",
  maker:
    "We keep the nostalgia. We change the experience. Play with friends, challenge new rivals, and turn the childhood games you remember into something competitive again.",
  stories: [
    {
      id: "familiar",
      title: "Familiar at heart",
      body: "You already know the feeling: rolling the dice, racing home, buying properties, collecting rent, and ruining your friend's perfect plan. BOARD keeps those moments at the center.",
    },
    {
      id: "different",
      title: "Built differently",
      body: "This time, you're not just passing the time. Enter a room, face three other players, and compete until only one winner remains.",
    },
  ],
  caption: "Four players. One board. One winner.",
} as const;
