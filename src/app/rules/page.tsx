import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { PrizeRulesContent } from "@/components/welcome/prize-rules-content";

export const metadata: Metadata = {
  title: "Prize & fee rules | BOARD",
  description:
    "How BOARD room pots work: four entry fees, one winner, 2% fee to treasury and burn.",
};

export default function PrizeRulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-8 font-pixel text-xs uppercase tracking-wide text-faint">
          <Link href="/" className="hover:text-gold">
            Welcome
          </Link>
          <span className="mx-2 text-edge-bright" aria-hidden>
            /
          </span>
          <span className="text-muted">Prize & fees</span>
        </nav>

        <PrizeRulesContent />
      </main>
    </>
  );
}
