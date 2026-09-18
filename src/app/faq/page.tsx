import type { Metadata } from "next";
import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { PixelCard } from "@/components/ui/pixel-card";
import { DemoFaqContent } from "@/components/welcome/demo-faq-content";

export const metadata: Metadata = {
  title: "FAQ | BOARD",
  description:
    "Questions before your first roll: BOARD gameplay, $BOARD, fees, rewards, and how the ecosystem works.",
};

export default function FaqPage() {
  return (
    <ProductShell accent="mint" strip={false}>
      <nav className="font-pixel text-xs uppercase tracking-wide text-parchment/80">
        <Link href="/" className="hover:text-gold">
          Welcome
        </Link>
        <span className="mx-2 text-void/50" aria-hidden>
          /
        </span>
        <span>FAQ</span>
      </nav>

      <PixelCard
        tone="cream"
        size="lg"
        className="w-full"
        faceClassName="px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      >
        <DemoFaqContent />
      </PixelCard>
    </ProductShell>
  );
}
