"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { TokenCaPromo } from "@/components/welcome/token-ca-promo";
import { WelcomeStage } from "@/components/welcome/welcome-stage";
import {
  SignInButton,
} from "@/components/account/sign-in-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { WELCOME_HERO, WELCOME_LIVE_PULSE } from "@/lib/mock/welcome";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { cn, formatBoardCompact } from "@/lib/utils";

type WelcomeHeroProps = {
  className?: string;
  tokenAddress: `0x${string}` | null;
  tokenExplorerUrl: string | null;
};

/**
 * Conversion hero: solid pitch dock left, living Monopoly + dice right.
 * Copy never sits on the board; animation never covers the CTAs.
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
      className={cn(
        "relative isolate flex min-h-[100dvh] flex-col overflow-hidden pt-4 sm:pt-6",
        className,
      )}
    >
      <WelcomeStage />

      {/*
        Two-column shell:
        - Left: conversion dock (readable solid ink)
        - Right: empty on purpose so the stage animation reads as the product
      */}
      <div className="relative z-20 mx-auto grid w-full max-w-[90rem] flex-1 grid-cols-1 px-3 pb-6 pt-3 sm:px-6 sm:pb-10 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-10 lg:pb-16 xl:px-14">
        {/* Mobile: leave top air for dice; desktop: center the dock */}
        <div className="flex flex-col justify-end pt-[38vh] sm:pt-[32vh] lg:justify-center lg:pt-0">
          <div className="w-full max-w-[26rem] pixel-corners-lg border-[4px] border-void bg-surface p-5 shadow-pixel-lg sm:max-w-[28rem] sm:p-7">
            <p
              data-hero-in
              className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep"
            >
              {WELCOME_HERO.eyebrow}
            </p>

            <h1
              data-hero-brand
              className="mt-3 font-pixel text-[clamp(2rem,7vw,3.25rem)] font-bold leading-[1.2] text-parchment"
            >
              {WELCOME_HERO.brand}
            </h1>

            <p
              data-hero-in
              className="mt-5 font-pixel text-lg font-semibold leading-snug text-parchment sm:text-xl"
            >
              {WELCOME_HERO.headline}
            </p>

            <p
              data-hero-in
              className="mt-3 text-base leading-relaxed text-muted"
            >
              {WELCOME_HERO.support}
            </p>

            <div
              data-hero-in
              className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
            >
              <PixelButtonLink
                href="/lobby"
                size="lg"
                variant="primary"
                className="w-full flex-1 justify-center"
              >
                Play now
              </PixelButtonLink>
              <SignInButton
                size="lg"
                variant="secondary"
                className="w-full flex-1 justify-center"
              >
                Sign in
              </SignInButton>
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

            <p
              data-hero-in
              className="mt-5 border-t-[3px] border-void pt-4 text-sm font-bold text-gold-deep sm:text-base"
            >
              {WELCOME_HERO.proof}
            </p>

            <dl
              data-hero-in
              className="mt-4 grid grid-cols-3 gap-2 border-t-[3px] border-void pt-4"
            >
              <div>
                <dt className="font-pixel text-xs font-semibold uppercase leading-none text-faint">
                  Rooms
                </dt>
                <dd className="mt-2 font-pixel text-base font-bold text-parchment sm:text-lg">
                  {WELCOME_LIVE_PULSE.openRooms}
                </dd>
              </div>
              <div>
                <dt className="font-pixel text-xs font-semibold uppercase leading-none text-faint">
                  Seated
                </dt>
                <dd className="mt-2 font-pixel text-base font-bold text-parchment sm:text-lg">
                  {WELCOME_LIVE_PULSE.playersOnline.toLocaleString("en-US")}
                </dd>
              </div>
              <div>
                <dt className="font-pixel text-xs font-semibold uppercase leading-none text-faint">
                  Won
                </dt>
                <dd className="mt-2 font-pixel text-base font-bold text-gold-deep sm:text-lg">
                  {formatBoardCompact(WELCOME_LIVE_PULSE.potToday)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Desktop spacer — keeps the pitch left; animation owns the right half */}
        <div className="hidden lg:block" aria-hidden />
      </div>
    </section>
  );
}
