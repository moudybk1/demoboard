import type { Metadata } from "next";

import { ProductShell } from "@/components/layout/product-shell";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { HowToSteps } from "@/components/welcome/how-to-steps";
import { HowToHeroActions } from "@/components/welcome/how-to-hero-actions";
import { PixelCard } from "@/components/ui/pixel-card";
import { WinGoalCompare } from "@/components/welcome/win-goal-compare";
import { HOW_TO_INTRO, HOW_TO_STEPS } from "@/lib/mock/how-to";

export const metadata: Metadata = {
  title: "How to play | BOARD",
  description:
    "Closed demo guide: enter with an invitation code, pick a table, and learn the turn controls.",
};

export default function HowToPage() {
  return (
    <ProductShell accent="monopoly">
      <PageHero
        title={HOW_TO_INTRO.title}
        support={HOW_TO_INTRO.support}
        meta={
          <>
            <HeroStat label="Steps" value={String(HOW_TO_STEPS.length)} />
            <HeroStat label="Seats" value="4" />
            <HeroStat label="Live stake" value="Off" />
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
                  {step.title}
                </span>
              </PixelCard>
            ))}
          </div>
        }
      />

      <div data-reveal>
        <HowToSteps />
      </div>

      <div data-reveal>
        <WinGoalCompare />
      </div>
    </ProductShell>
  );
}
