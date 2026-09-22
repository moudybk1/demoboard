"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelButtonLink } from "@/components/ui/pixel-button";
import { ConnectWalletButton } from "@/components/layout/connect-wallet-button";
import { WelcomeStage } from "@/components/welcome/welcome-stage";
import { LudoDemo } from "@/components/welcome/game-demos";
import { isGameEnabled } from "@/lib/game-availability";
import { WELCOME_HERO } from "@/lib/mock/welcome";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { cn } from "@/lib/utils";

type WelcomeHeroProps = {
  className?: string;
};

/**
 * Open hero: benefit-led headline, quiet reading surface, tabletop preview.
 * No nested frames or token-address placeholders in this section.
 */
export function WelcomeHero({ className }: WelcomeHeroProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const brand = node.querySelector<HTMLElement>("[data-hero-brand]");
    const lines = node.querySelectorAll<HTMLElement>("[data-hero-in]");

    const intro = gsap.timeline();
    if (brand) {
      intro.from(brand, {
        y: 14,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform",
      });
    }
    intro.from(
      lines,
      {
        y: 8,
        duration: 0.32,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "transform",
      },
      "-=0.26",
    );

    return () => {
      intro.kill();
    };
  }, []);

  return (
    <section
      ref={root}
      className={cn("board-container py-6 sm:py-10 lg:py-12", className)}
    >
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 xl:gap-12">
        <div className="relative z-[1] max-w-[34rem] lg:max-w-none">
          <h1
            data-hero-brand
            className="max-w-[22ch] font-pixel text-[clamp(2.35rem,5.5vw,4.75rem)] font-bold leading-[1.12] tracking-tight text-parchment"
          >
            {WELCOME_HERO.headline}
          </h1>

          <p
            data-hero-in
            className="mt-5 max-w-[40ch] text-base leading-relaxed text-muted sm:text-[1.125rem] sm:leading-[1.65]"
          >
            {WELCOME_HERO.support}
          </p>

          <div
            data-hero-in
            className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
          >
            {WELCOME_HERO.ctas.map((cta) =>
              cta.action === "connect-wallet" ? (
                <ConnectWalletButton
                  key={cta.label}
                  label={cta.label}
                  size={cta.variant === "primary" ? "lg" : "md"}
                  variant={cta.variant === "outline" ? "outline" : cta.variant}
                  className="w-full opacity-95 sm:w-auto"
                />
              ) : (
                <PixelButtonLink
                  key={cta.href}
                  href={cta.href}
                  size={cta.variant === "primary" ? "lg" : "md"}
                  variant={cta.variant === "outline" ? "outline" : cta.variant}
                  {...(cta.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={cn(
                    "justify-center",
                    cta.variant === "primary"
                      ? "w-full sm:w-auto sm:min-w-[12rem]"
                      : "w-full opacity-95 sm:w-auto",
                  )}
                >
                  {cta.label}
                </PixelButtonLink>
              ),
            )}
          </div>
        </div>

        {isGameEnabled("monopoly") ? (
          <WelcomeStage />
        ) : (
          <div id="try-a-turn" className="mx-auto w-full max-w-lg scroll-mt-28">
            <div className="border-[3px] border-void bg-cream p-4 shadow-pixel sm:p-6">
              <p className="mb-4 text-center font-pixel text-lg font-bold text-ludo">
                Ludo is live
              </p>
              <LudoDemo />
              <p className="mt-4 text-center font-pixel text-sm text-parchment">
                Race your pawns home. One winner.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
