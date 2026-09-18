import Link from "next/link";

import { GameChoice } from "@/components/welcome/game-choice";
import { cn } from "@/lib/utils";

/**
 * Game pick on the hero sky — rivalry header + tabletop felt stage for the cards.
 */
export function WelcomeHighlights({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="welcome-modes"
      id="games"
      className={cn(
        "relative z-10 scroll-mt-28 overflow-visible bg-transparent pb-14 sm:pb-16",
        className,
      )}
    >
      <div className="board-container relative z-10 pt-10 sm:pt-14">
        <header className="mb-8 max-w-3xl sm:mb-10">
          <p className="font-pixel text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
            Pick a board
          </p>
          <h2
            id="welcome-modes"
            className="mt-3 font-pixel text-[clamp(1.85rem,3.6vw,3rem)] font-bold leading-[1.12] tracking-tight text-parchment"
          >
            Choose your childhood favorite.
          </h2>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted sm:text-[1.0625rem]">
            The games you remember, now with something to fight for. Pick your
            board, challenge three rivals, and be the last one standing.
          </p>
          <p className="mt-4 text-sm text-muted">
            New here?{" "}
            <Link href="/faq" className="text-link underline hover:text-parchment">
              FAQ
            </Link>
            {" · "}
            <Link href="/how-to" className="text-link underline hover:text-parchment">
              How to play
            </Link>
            {" · "}
            <Link href="/rules" className="text-link underline hover:text-parchment">
              Prizes and fees
            </Link>
          </p>
        </header>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 -bottom-3 top-16 rounded-[2px] border-[3px] border-void bg-felt opacity-90 shadow-pixel sm:inset-x-8 sm:top-20"
          />
          <div className="relative z-[1]">
            <GameChoice />
          </div>
        </div>
      </div>
    </section>
  );
}
