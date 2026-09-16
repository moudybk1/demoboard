import type { Metadata } from "next";

import { ProductShell } from "@/components/layout/product-shell";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { HowToSteps } from "@/components/welcome/how-to-steps";
import { HowToHeroActions } from "@/components/welcome/how-to-hero-actions";
import { WinGoalCompare } from "@/components/welcome/win-goal-compare";
import { HOW_TO_INTRO, HOW_TO_STEPS } from "@/lib/mock/how-to";

export const metadata: Metadata = {
  title: "How to play | BOARD",
  description:
    "Numbered guide: deposit BOARD, pick Monopoly or Ludo, join a four-player room, and win the pot minus a 2% fee.",
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
            <HeroStat label="Keep" value="98%" />
            <HeroStat label="Seats" value="4" />
          </>
        }
        actions={<HowToHeroActions />}
        stage={
          <div className="grid grid-cols-2 gap-2">
            {HOW_TO_STEPS.slice(0, 4).map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 border-2 border-edge bg-ink/75 px-2.5 py-2.5 pixel-inset"
              >
                <span className="grid size-7 shrink-0 place-items-center border-2 border-gold-deep bg-gold font-pixel text-xs text-void">
                  {step.number}
                </span>
                <span className="font-pixel text-[11px] uppercase leading-relaxed text-parchment">
                  {step.title}
                </span>
              </div>
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
