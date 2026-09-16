"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

import { LudoDemo, MonopolyDemo } from "@/components/welcome/game-demos";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { WELCOME_HIGHLIGHTS } from "@/lib/mock/welcome";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { cn } from "@/lib/utils";

const MODES = [
  {
    id: "monopoly",
    title: "Monopoly",
    body: "Buy cities, collect rent, bankrupt the table. Pawns hop the perimeter one tile at a time.",
    href: "/lobby",
    Demo: MonopolyDemo,
  },
  {
    id: "ludo",
    title: "Ludo",
    body: "Roll a 6 to leave the yard. Capture rivals, stack blockades, race every pawn home.",
    href: "/lobby",
    Demo: LudoDemo,
  },
] as const;

/**
 * Asymmetric game-mode showcase with live board loops (not a three-card grid).
 */
export function WelcomeHighlights({ className }: { className?: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const rows = node.querySelectorAll<HTMLElement>("[data-mode-row]");
    const tween = gsap.fromTo(
      rows,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: undefined,
      },
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section
      ref={root}
      aria-labelledby="welcome-modes"
      className={cn("border-t-[3px] border-void bg-cream/55 py-16 sm:py-24", className)}
    >
      <div className="board-container">
        <div className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="welcome-modes"
            className="max-w-[18ch] font-pixel text-2xl font-bold leading-snug text-parchment sm:text-3xl"
          >
            Two tables. Same pot fight.
          </h2>
          <p className="max-w-[40ch] text-base leading-relaxed text-muted">
            Four seats, one survivor. Watch the boards breathe, then take a
            chair in the lobby.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-24">
          {MODES.map((mode, index) => (
            <article
              key={mode.id}
              data-mode-row
              className={cn(
                "grid items-center gap-10 overflow-visible lg:grid-cols-2 lg:gap-14",
                index % 2 === 1 && "lg:[&>*:first-child]:order-2",
              )}
            >
              <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
                <div className="relative overflow-hidden pixel-corners-lg border-[4px] border-void bg-cream p-4 shadow-pixel-lg sm:p-5">
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-6 bottom-3 h-6",
                      mode.id === "monopoly" ? "bg-monopoly/30" : "bg-ludo/30",
                    )}
                  />
                  <mode.Demo className="relative z-[1]" />
                </div>
              </div>

              <div className="max-w-md">
                <h3
                  className={cn(
                    "font-pixel text-[18px] leading-snug sm:text-[22px]",
                    mode.id === "monopoly" ? "text-monopoly" : "text-ludo",
                  )}
                >
                  {mode.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {mode.body}
                </p>
                <PixelButtonLink
                  href={mode.href}
                  variant={mode.id === "monopoly" ? "monopoly" : "ludo"}
                  size="md"
                  className="mt-6"
                >
                  Play {mode.title}
                </PixelButtonLink>
              </div>
            </article>
          ))}
        </div>

        <ul className="mt-20 grid gap-6 border-t-[3px] border-void pt-10 sm:grid-cols-3">
          {WELCOME_HIGHLIGHTS.map((item) => (
            <li key={item.id}>
              <h3 className="font-pixel text-xs font-semibold uppercase leading-snug text-gold-deep">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-faint">
          New here?{" "}
          <Link href="/how-to" className="text-gold underline-offset-4 hover:underline">
            How to play
          </Link>
          {" · "}
          <Link href="/rules" className="text-gold underline-offset-4 hover:underline">
            House rules
          </Link>
        </p>
      </div>
    </section>
  );
}
