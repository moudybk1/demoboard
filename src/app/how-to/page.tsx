import type { Metadata } from "next";

import { ProductShell } from "@/components/layout/product-shell";
import { LudoRulesContent } from "@/components/play/ludo-rules-content";
import { PixelCard } from "@/components/ui/pixel-card";

export const metadata: Metadata = {
  title: "How to play | BOARD",
  description:
    "Five steps. Four players. One winner. Choose your game, enter a room, and start the rivalry.",
};

export default function HowToPage() {
  return (
    <ProductShell accent="gold" strip={false}>
      <PixelCard tone="cream" size="lg" faceClassName="px-5 py-7 sm:px-8 sm:py-10"><LudoRulesContent /></PixelCard>
    </ProductShell>
  );
}
