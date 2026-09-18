import {
  getEconomyExample,
  getRoomEconomyConfig,
} from "@/server/services/economy.service";
import {
  HOW_TO_CTAS,
  HOW_TO_INTRO,
  HOW_TO_STEPS,
} from "@/lib/mock/how-to";
import { PRIZE_CTAS, PRIZE_RULES, PRIZE_RULES_INTRO } from "@/lib/mock/prize-rules";
import { ROADMAP, TOKEN_INFO } from "@/lib/mock/token-roadmap";
import {
  ONBOARDING_ACTIONS,
  ONBOARDING_STEPS,
  WELCOME_HERO,
  WELCOME_HIGHLIGHTS,
  WELCOME_LIVE_PULSE,
} from "@/lib/mock/welcome";
import { WIN_GOAL_INTRO, WIN_GOALS } from "@/lib/mock/win-goals";

/**
 * Guide / welcome content served to the panduan surfaces. Content is curated
 * mock copy for now · swapping the source to CMS/DB later keeps the same shape.
 */

export const GUIDE_SECTIONS = [
  "welcome",
  "how-to",
  "win-goals",
  "rules",
  "token",
] as const;

export type GuideSection = (typeof GUIDE_SECTIONS)[number];

export function isGuideSection(value: string): value is GuideSection {
  return (GUIDE_SECTIONS as readonly string[]).includes(value);
}

export function getWelcomeGuide() {
  return {
    hero: WELCOME_HERO,
    highlights: WELCOME_HIGHLIGHTS,
    livePulse: WELCOME_LIVE_PULSE,
    onboarding: {
      steps: ONBOARDING_STEPS,
      actions: ONBOARDING_ACTIONS,
    },
  };
}

export function getHowToGuide() {
  return {
    intro: HOW_TO_INTRO,
    steps: HOW_TO_STEPS,
    ctas: HOW_TO_CTAS,
  };
}

export function getWinGoalsGuide() {
  return {
    intro: WIN_GOAL_INTRO,
    games: WIN_GOALS,
  };
}

export function getRulesGuide() {
  const example = getEconomyExample();
  const config = getRoomEconomyConfig();

  return {
    intro: PRIZE_RULES_INTRO,
    rules: [...PRIZE_RULES],
    example: {
      entryFee: example.entryFee,
      seats: example.seats,
      grossPot: example.grossPot,
      feePercent: config.prizeFeePercent,
      feeAmount: example.feeAmount,
      winnerPayout: example.winnerPayout,
      treasuryAmount: example.treasuryAmount,
      buybackAmount: example.buybackAmount,
      burnAmount: example.burnAmount,
    },
    economy: config,
    ctas: PRIZE_CTAS,
  };
}

export function getTokenGuide() {
  return {
    token: TOKEN_INFO,
    roadmap: ROADMAP,
  };
}

export function getGuideSection(section: GuideSection) {
  switch (section) {
    case "welcome":
      return getWelcomeGuide();
    case "how-to":
      return getHowToGuide();
    case "win-goals":
      return getWinGoalsGuide();
    case "rules":
      return getRulesGuide();
    case "token":
      return getTokenGuide();
  }
}

/** Full guide bundle for clients that want one round-trip. */
export function getFullGuide() {
  return {
    welcome: getWelcomeGuide(),
    howTo: getHowToGuide(),
    winGoals: getWinGoalsGuide(),
    rules: getRulesGuide(),
    token: getTokenGuide(),
    sections: [...GUIDE_SECTIONS],
  };
}
