import Link from "next/link";

import { PixelArt } from "@/components/game/pixel-art";
import { GameChoice } from "@/components/welcome/game-choice";
import { PixelTerrain } from "@/components/welcome/pixel-terrain";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { WELCOME_HIGHLIGHTS } from "@/lib/mock/welcome";
import { cn } from "@/lib/utils";

/**
 * Game pick + quieter supporting facts. Terrain sits in flow so the
 * heading never hides under the hill seam.
 */
export function WelcomeHighlights({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="welcome-modes"
      className={cn(
        "relative z-10 overflow-visible bg-cream pb-32 sm:pb-40",
        className,
      )}
    >
      <PixelTerrain
        placed="stack"
        variant="skyline"
        className="text-cream"
      />

      <div className="board-container relative z-10 pt-8 sm:pt-10">
        <div className="mb-10 max-w-xl sm:mb-12">
          <h2
            id="welcome-modes"
            className="font-pixel text-3xl font-bold leading-snug text-parchment sm:text-4xl"
          >
            Two tables. Same pot fight.
          </h2>
          <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-muted sm:text-[17px]">
            Four seats, one survivor. Pick a table, then enter the closed demo
            to take a chair.
          </p>
        </div>

        <GameChoice />

        <div className="relative z-20 mt-14 max-w-xl sm:mt-16">
          <h3 className="font-pixel text-xl font-bold text-parchment sm:text-2xl">
            Demo FAQ
          </h3>
          <dl className="mt-6 space-y-6">
            {WELCOME_HIGHLIGHTS.map((item) => (
              <div key={item.id}>
                <dt className="font-pixel text-sm font-semibold uppercase leading-snug text-parchment">
                  {item.title}
                </dt>
                <dd className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted sm:text-base">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative z-20 mt-10 text-sm text-muted sm:mt-12">
          New here?{" "}
          <Link href="/how-to" className="text-link underline hover:text-parchment">
            How to play
          </Link>
          {" · "}
          <Link href="/rules" className="text-link underline hover:text-parchment">
            Prizes and fees
          </Link>
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-32 sm:h-40">
        <PixelTerrain edge="bottom" variant="dunes" className="text-felt" />
        <div className="absolute bottom-[4.6rem] left-[12%] w-9 sm:bottom-[6.2rem] sm:w-11">
          <PixelArt sprite={pawnSprite(1)} />
        </div>
        <div className="absolute bottom-[5.4rem] left-[48%] w-9 sm:bottom-[7.2rem] sm:w-11">
          <PixelArt sprite={pawnSprite(2)} />
        </div>
        <div className="absolute bottom-[4.4rem] right-[14%] w-9 sm:bottom-[6rem] sm:w-11">
          <PixelArt sprite={pawnSprite(4)} />
        </div>
      </div>
    </section>
  );
}
