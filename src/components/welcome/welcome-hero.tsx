"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { TokenCaPromo } from "@/components/welcome/token-ca-promo";
import { WelcomeStage } from "@/components/welcome/welcome-stage";
import { WELCOME_HERO } from "@/lib/mock/welcome";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

type WelcomeHeroProps = {
  className?: string;
  tokenAddress: `0x${string}` | null;
  tokenExplorerUrl: string | null;
};

/**
 * Lobby hero: pitch first, compact demo preview second.
 * Mobile stacks copy then board so the CTA is on screen before the table.
 */
export function WelcomeHero({
  className,
  tokenAddress,
  tokenExplorerUrl,
}: WelcomeHeroProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const brand = node.querySelector<HTMLElement>("[data-hero-brand]");
    const lines = node.querySelectorAll<HTMLElement>("[data-hero-in]");

    const intro = gsap.timeline();
    if (brand) {
      intro.from(brand, {
        y: 18,
        duration: 0.55,
        ease: "power3.out",
        clearProps: "transform",
      });
    }
    intro.from(
      lines,
      {
        y: 10,
        duration: 0.35,
        stagger: 0.055,
        ease: "power2.out",
        clearProps: "transform",
      },
      "-=0.28",
    );

    return () => {
      intro.kill();
    };
  }, []);

  return (
    <section
      ref={root}
      className={cn("board-container py-5 sm:py-8", className)}
    >
      <PixelCard
        size="lg"
        tone="felt"
        className="w-full"
        faceClassName="relative isolate p-4 sm:p-6 lg:p-7"
      >
        <div className="relative z-[1] grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8">
          <PixelCard
            size="md"
            className="w-full max-w-[28rem] lg:max-w-none"
            faceClassName="p-5 sm:p-7"
          >
            <p
              data-hero-in
              className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep"
            >
              {WELCOME_HERO.eyebrow}
            </p>

            <h1
              data-hero-brand
              className="mt-3 font-pixel text-[clamp(2.1rem,6vw,3.35rem)] font-bold leading-[1.15] text-parchment"
            >
              {WELCOME_HERO.brand}
            </h1>

            <p
              data-hero-in
              className="mt-4 font-pixel text-lg font-semibold leading-snug text-parchment sm:text-xl"
            >
              {WELCOME_HERO.headline}
            </p>

            <p
              data-hero-in
              className="mt-3 max-w-[36ch] text-base leading-relaxed text-muted sm:text-[17px]"
            >
              {WELCOME_HERO.support}
            </p>

            <div
              data-hero-in
              className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
            >
              {WELCOME_HERO.ctas.map((cta) => (
                <PixelButtonLink
                  key={cta.href}
                  href={cta.href}
                  size="lg"
                  variant={cta.variant}
                  className="w-full flex-1 justify-center"
                >
                  {cta.label}
                </PixelButtonLink>
              ))}
            </div>

            <div data-hero-in>
              <TokenCaPromo
                className="mt-5"
                compact
                address={tokenAddress}
                explorerUrl={tokenExplorerUrl}
                chainLabel={ROBINHOOD_CHAIN_LABEL}
              />
            </div>
          </PixelCard>

          <WelcomeStage />
        </div>
      </PixelCard>
    </section>
  );
}
