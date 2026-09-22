import type { Metadata } from "next";

import { PlayStage } from "@/components/play/play-stage";
import { parsePreviewGame } from "@/lib/preview-game";
import {
  enabledPlayGame,
  isGameEnabled,
  WORK_IN_PROGRESS,
} from "@/lib/game-availability";

export const metadata: Metadata = {
  title: "Play | BOARD",
  description: "Connect a wallet and play Ludo. Monopoly is a work in progress.",
};

type PlayPageProps = {
  searchParams: Promise<{ game?: string | string[] }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.game) ? params.game[0] : params.game;
  const requestedGame = parsePreviewGame(raw);
  const initialGame = enabledPlayGame(requestedGame);

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col">
      {requestedGame && !isGameEnabled(requestedGame) && (
        <p role="status" className="bg-void px-4 py-3 text-center font-pixel text-gold">
          Monopoly · {WORK_IN_PROGRESS}. Ludo is available below.
        </p>
      )}
      <PlayStage initialGame={initialGame} />
    </main>
  );
}
