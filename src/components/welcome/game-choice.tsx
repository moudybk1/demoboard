"use client";

import { PixelButton, PixelButtonLink } from "@/components/ui/pixel-button";
import { WorkInProgressWatermark } from "@/components/game/work-in-progress";
import { isGameEnabled, WORK_IN_PROGRESS } from "@/lib/game-availability";
import { PixelCard } from "@/components/ui/pixel-card";
import { LudoDemo, MonopolyDemo } from "@/components/welcome/game-demos";
import { WELCOME_GAMES } from "@/lib/mock/welcome";
import {
  playPathForGame,
  rememberPreviewGame,
} from "@/lib/preview-game";
import { cn } from "@/lib/utils";

/**
 * Rivalry game pick: staggered Monopoly / Ludo cards with a center VS mark.
 */
export function GameChoice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch lg:gap-4",
        className,
      )}
    >
      {WELCOME_GAMES.map((game, index) => {
        const href = playPathForGame(game.id);
        const Demo = game.id === "monopoly" ? MonopolyDemo : LudoDemo;
        const isMonopoly = game.id === "monopoly";
        const enabled = isGameEnabled(game.id);

        return (
          <div key={game.id} className="contents">
            {index === 1 ? (
              <div
                aria-hidden
                className="relative z-[2] hidden items-center justify-center lg:flex"
              >
                <span className="grid size-14 place-items-center border-[3px] border-void bg-gold font-pixel text-lg font-bold text-void shadow-pixel rotate-[-6deg]">
                  VS
                </span>
              </div>
            ) : null}

            <PixelCard
              size="lg"
              tone={isMonopoly ? "monopoly" : "ludo"}
              stroke={isMonopoly ? "monopoly" : "ludo"}
              className={cn(
                "transition-[transform,filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:brightness-[1.02] focus-within:-translate-y-1.5",
                index === 0 && "lg:-rotate-1 lg:translate-y-2",
                index === 1 && "lg:rotate-1 lg:-translate-y-2",
              )}
              faceClassName="flex h-full flex-col overflow-hidden"
            >
              <div
                aria-hidden
                className={cn(
                  "flex items-center justify-between px-4 py-2",
                  isMonopoly ? "bg-monopoly" : "bg-ludo",
                )}
              >
                <span className="font-pixel text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
                  {isMonopoly ? "Table A" : "Table B"}
                </span>
                <span className="font-pixel text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/80">
                  4 seats
                </span>
              </div>

              <div className="pointer-events-none relative mx-auto mt-5 w-full max-w-[20rem] px-4 sm:mt-6">
                <Demo />
                {!enabled && <WorkInProgressWatermark />}
              </div>

              <div className="flex flex-1 flex-col px-5 pb-2 pt-5">
                <h3
                  className={cn(
                    "font-pixel text-xl font-bold sm:text-2xl",
                    isMonopoly ? "text-monopoly" : "text-ludo",
                  )}
                >
                  {game.title}
                </h3>
                <p className="mt-2 font-pixel text-base font-semibold leading-snug text-parchment sm:text-lg">
                  {game.punch}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {game.closeup}
                </p>
              </div>

              <div className="px-5 pb-5 pt-2">
                {!enabled ? (
                  <PixelButton
                    disabled
                    size="md"
                    variant="outline"
                    className="w-full justify-center"
                  >
                    {WORK_IN_PROGRESS}
                  </PixelButton>
                ) : (
                  <PixelButtonLink
                    href={href}
                    size="md"
                    variant={isMonopoly ? "monopoly" : "ludo"}
                    className="w-full justify-center"
                    onClick={() => rememberPreviewGame(game.id)}
                  >
                    {game.cta}
                  </PixelButtonLink>
                )}
              </div>
            </PixelCard>
          </div>
        );
      })}
    </div>
  );
}
