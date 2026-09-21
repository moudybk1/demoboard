"use client";

import { PlayGate } from "@/components/play/play-gate";
import { PlayLobby } from "@/components/play/play-lobby";
import { usePlaySit } from "@/hooks/use-play-sit";
import type { PreviewGame } from "@/lib/preview-game";

type PlayStageProps = {
  initialGame: PreviewGame;
};

/**
 * Play client: wallet gate, then the live lobby, then sit into a table.
 */
export function PlayStage({ initialGame }: PlayStageProps) {
  const play = usePlaySit();

  if (!play.wallet.isConnected) {
    return <PlayGate />;
  }

  return <PlayLobby initialGame={initialGame} play={play} />;
}
