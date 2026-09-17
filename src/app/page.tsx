import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OnboardingPath } from "@/components/welcome/onboarding-path";
import { TokenRoadmapSection } from "@/components/welcome/token-roadmap-section";
import { WelcomeHero } from "@/components/welcome/welcome-hero";
import { WelcomeHighlights } from "@/components/welcome/welcome-highlights";
import {
  getBoardTokenAddress,
  getBoardTokenExplorerUrl,
} from "@/lib/wallet/chains";

export const metadata: Metadata = {
  title: "BOARD | Closed demo · cartoon pixel Monopoly & Ludo",
  description:
    "Roll, buy, capture. Four player Monopoly and Ludo on a cartoon pixel tabletop. This closed demo shows the tables; live BOARD staking is next.",
};

export default function Home() {
  const tokenAddress = getBoardTokenAddress();
  const tokenExplorerUrl = getBoardTokenExplorerUrl();

  return (
    <div className="board-atmosphere flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col overflow-x-hidden">
        <WelcomeHero
          tokenAddress={tokenAddress}
          tokenExplorerUrl={tokenExplorerUrl}
        />
        <WelcomeHighlights />
        <OnboardingPath />
        <TokenRoadmapSection
          tokenAddress={tokenAddress}
          tokenExplorerUrl={tokenExplorerUrl}
        />
      </main>
      <SiteFooter seam />
    </div>
  );
}
