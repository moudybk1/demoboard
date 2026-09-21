"use client";

import { StartMatchButton } from "@/components/lobby/start-match-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import type { GameType } from "@/lib/types";

/** Lobby hero CTAs. Start a match immediately. */
export function LobbyHeroActions({
  game = "monopoly",
}: {
  game?: GameType;
}) {
  return (
    <>
      <StartMatchButton game={game} size="md" variant="primary">
        Play now
      </StartMatchButton>
      <PixelButtonLink href="/how-to" variant="ghost" size="md">
        How it works
      </PixelButtonLink>
    </>
  );
}
