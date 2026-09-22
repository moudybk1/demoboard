import type { Metadata } from "next";
import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { PixelCard } from "@/components/ui/pixel-card";
import { LudoRulesContent } from "@/components/play/ludo-rules-content";

export const metadata: Metadata = {
  title: "Prizes & fees | BOARD",
  description:
    "Simple rules. Transparent fees. One winner. Four players, one prize pool, and a 2% protocol fee.",
};

export default function PrizeRulesPage() {
  return (
    <ProductShell accent="gold" strip={false}>
      <nav className="font-pixel text-xs uppercase tracking-wide text-parchment/80">
        <Link href="/" className="hover:text-gold">
          Welcome
        </Link>
        <span className="mx-2 text-void/50" aria-hidden>
          /
        </span>
        <span>Prizes & fees</span>
      </nav>

      <PixelCard
        tone="cream"
        size="lg"
        className="w-full"
        faceClassName="px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      >
        <LudoRulesContent />
      </PixelCard>
    </ProductShell>
  );
}
