"use client";

import { PixelButtonLink } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { LudoDemo, MonopolyDemo } from "@/components/welcome/game-demos";
import { useDemoAccess } from "@/hooks/use-demo-access";
import { WELCOME_GAMES } from "@/lib/mock/welcome";
import {
  demoPathForGame,
  lobbyPathForGame,
  rememberPreviewGame,
} from "@/lib/preview-game";
import { cn } from "@/lib/utils";

/**
 * Independent game cards. Each one is a direct path into that table's demo.
 */
export function GameChoice({ className }: { className?: string }) {
  const { unlocked } = useDemoAccess();

  return (
    <div className={cn("grid gap-5 lg:grid-cols-2 lg:gap-6", className)}>
      {WELCOME_GAMES.map((game) => {
        const href = unlocked
          ? lobbyPathForGame(game.id)
          : demoPathForGame(game.id);
        const Demo = game.id === "monopoly" ? MonopolyDemo : LudoDemo;

        return (
          <PixelCard
            key={game.id}
            size="lg"
            tone={game.id === "monopoly" ? "monopoly" : "ludo"}
            stroke={game.id === "monopoly" ? "monopoly" : "ludo"}
            className="transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 focus-within:-translate-y-1"
            faceClassName="flex h-full flex-col overflow-hidden"
          >
            <div
              aria-hidden
              className={cn(
                "h-2 w-full",
                game.id === "monopoly" ? "bg-monopoly" : "bg-ludo",
              )}
            />
            <div className="pointer-events-none relative mx-auto mt-4 w-full max-w-[18rem] px-4">
              <Demo />
            </div>
            <div className="flex flex-1 flex-col px-5 pb-2 pt-4">
              <h3
                className={cn(
                  "font-pixel text-xl font-bold sm:text-2xl",
                  game.id === "monopoly" ? "text-monopoly" : "text-ludo",
                )}
              >
                {game.title}
              </h3>
              <p className="mt-2 font-pixel text-sm font-semibold leading-snug text-parchment sm:text-base">
                {game.punch}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {game.closeup}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {game.meta}
              </p>
            </div>
            <div className="px-5 pb-5">
              <PixelButtonLink
                href={href}
                size="md"
                variant={game.id === "monopoly" ? "monopoly" : "ludo"}
                className="w-full justify-center"
                onClick={() => rememberPreviewGame(game.id)}
              >
                {unlocked ? `Play ${game.title}` : game.cta}
              </PixelButtonLink>
              {unlocked ? null : (
                <p className="mt-2 text-center text-xs leading-relaxed text-muted">
                  Access code required
                </p>
              )}
            </div>
          </PixelCard>
        );
      })}
    </div>
  );
}
