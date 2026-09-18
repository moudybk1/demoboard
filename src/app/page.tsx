import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { InsideBoard } from "@/components/welcome/inside-board";
import { TokenRoadmapSection } from "@/components/welcome/token-roadmap-section";
import { WelcomeHero } from "@/components/welcome/welcome-hero";
import { WelcomeHighlights } from "@/components/welcome/welcome-highlights";
import {
  getBoardTokenAddress,
  getBoardTokenExplorerUrl,
} from "@/lib/wallet/chains";

export const metadata: Metadata = {
  title: "BOARD | Relive your childhood. Play it differently.",
  description:
    "The board games you grew up with, reimagined as competitive four-player PvP. Closed demo by invitation.",
};

export default function Home() {
  const tokenAddress = getBoardTokenAddress();
  const tokenExplorerUrl = getBoardTokenExplorerUrl();

  return (
    <div className="board-atmosphere flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col overflow-x-hidden">
        <WelcomeHero />
        <WelcomeHighlights />
        <InsideBoard />
        <TokenRoadmapSection
          tokenAddress={tokenAddress}
          tokenExplorerUrl={tokenExplorerUrl}
        />
      </main>
      <SiteFooter seam />
    </div>
  );
}
