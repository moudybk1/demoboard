"use client";

import { PlayGate } from "@/components/play/play-gate";
import { PlayLobby } from "@/components/play/play-lobby";
import { useClientReady } from "@/hooks/use-client-ready";
import { usePlaySit } from "@/hooks/use-play-sit";
import type { PreviewGame } from "@/lib/preview-game";

type PlayStageProps = {
  initialGame: PreviewGame;
};

/**
 * Play client: wallet gate, then the live lobby, then sit into a table.
 * The lobby waits until the client has mounted so wagmi cookie reconnect
 * cannot swap Sit/Need markup during hydration.
 */
export function PlayStage({ initialGame }: PlayStageProps) {
  const play = usePlaySit();
  const ready = useClientReady();

  if (!ready || !play.wallet.isConnected) {
    return <PlayGate />;
  }

  return <PlayLobby initialGame={initialGame} play={play} />;
}
