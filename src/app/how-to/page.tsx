import type { Metadata } from "next";

import { ProductShell } from "@/components/layout/product-shell";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { HowToSteps } from "@/components/welcome/how-to-steps";
import { HowToHeroActions } from "@/components/welcome/how-to-hero-actions";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  HOW_TO_INTRO,
  HOW_TO_STEPS,
} from "@/lib/mock/how-to";

export const metadata: Metadata = {
  title: "How to play | BOARD",
  description:
    "Five steps. Four players. One winner. Choose your game, enter a room, and start the rivalry.",
};

export default function HowToPage() {
  return (
    <ProductShell accent="monopoly" strip={false}>
      <PageHero
        title={HOW_TO_INTRO.title}
        punch={HOW_TO_INTRO.punch}
        support={HOW_TO_INTRO.support}
        meta={
          <>
            <HeroStat label="Steps" value="5" />
            <HeroStat label="Players" value="4" />
            <HeroStat label="Winner" value="1" />
          </>
        }
        actions={<HowToHeroActions />}
        stage={
          <div className="grid grid-cols-2 gap-2">
            {HOW_TO_STEPS.slice(0, 4).map((step) => (
              <PixelCard
                key={step.id}
                size="sm"
                tone="ink"
                faceClassName="flex items-center gap-2 px-2.5 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center border-2 border-gold-deep bg-gold font-pixel text-xs text-void">
                  {step.number}
                </span>
                <span className="font-pixel text-[11px] uppercase leading-relaxed text-cream">
                  {step.label}
                </span>
              </PixelCard>
            ))}
          </div>
        }
      />

      <div data-reveal>
        <HowToSteps />
      </div>
    </ProductShell>
  );
}
