/**
 * Mock copy for the welcome / landing surface.
 */

export type WelcomeCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type WelcomeHighlight = {
  id: string;
  title: string;
  body: string;
};

export const WELCOME_HERO = {
  brand: "BOARD",
  eyebrow: "Closed demo",
  headline: "Try the tables.",
  support:
    "Four-player Monopoly and Ludo on a cartoon pixel board. Closed preview. Staking is not live yet.",
  proof: "No real BOARD is deposited or paid out here.",
  ctas: [
    { label: "Enter demo", href: "/demo", variant: "primary" },
    { label: "How to play", href: "/how-to", variant: "secondary" },
  ] as WelcomeCta[],
};

export const WELCOME_GAMES = [
  {
    id: "monopoly" as const,
    title: "Monopoly",
    punch: "Build your property empire",
    meta: "Four players · Strategy and trading",
    cta: "Enter Monopoly demo",
    closeup: "Buying a street and collecting rent",
  },
  {
    id: "ludo" as const,
    title: "Ludo",
    punch: "Race home. Send rivals back.",
    meta: "Four players · Racing and captures",
    cta: "Enter Ludo demo",
    closeup: "Capturing a pawn and sending it home",
  },
] as const;

export const WELCOME_HIGHLIGHTS: WelcomeHighlight[] = [
  {
    id: "wallet",
    title: "Do I need a wallet?",
    body: "Not for this closed demo. You enter with an invitation code and play with sample balances.",
  },
  {
    id: "includes",
    title: "What does the demo include?",
    body: "Four-seat Monopoly and Ludo tables, sample pots, and the turn controls. No real tokens move.",
  },
  {
    id: "code",
    title: "How do I get in?",
    body: "Use the access code from the project link. Public pages stay open if you do not have one yet.",
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
    title: "Enter your code",
    body: "Invitation code from the project link.",
    status: "upcoming",
    href: "/demo",
  },
  {
    id: "lobby",
    index: 2,
    title: "Pick a table",
    body: "Monopoly or Ludo. Sample pots only.",
    status: "upcoming",
    href: "/demo",
  },
  {
    id: "win",
    index: 3,
    title: "Join a sample table",
    body: "Four seats. Nothing cashes out.",
    status: "upcoming",
    href: "/demo",
  },
];

export const ONBOARDING_ACTIONS: WelcomeCta[] = [
  { label: "Enter closed demo", href: "/demo", variant: "primary" },
];
