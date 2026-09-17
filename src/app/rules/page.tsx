import type { Metadata } from "next";
import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { PixelCard } from "@/components/ui/pixel-card";
import { PrizeRulesContent } from "@/components/welcome/prize-rules-content";

export const metadata: Metadata = {
  title: "Prize & fee rules | BOARD",
  description:
    "How BOARD room pots work: four entry fees, one winner, 2% fee to treasury and burn.",
};

export default function PrizeRulesPage() {
  return (
    <ProductShell accent="gold">
      <nav className="font-pixel text-xs uppercase tracking-wide text-parchment/80">
        <Link href="/" className="hover:text-gold">
          Welcome
        </Link>
        <span className="mx-2 text-void/50" aria-hidden>
          /
        </span>
        <span>Prizes and fees</span>
      </nav>

      <PixelCard
        tone="cream"
        size="lg"
        className="w-full"
        faceClassName="px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      >
        <PrizeRulesContent />
      </PixelCard>
    </ProductShell>
  );
}
