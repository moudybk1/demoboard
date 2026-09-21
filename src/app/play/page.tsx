import type { Metadata } from "next";

import { PlayStage } from "@/components/play/play-stage";
import { parsePreviewGame } from "@/lib/preview-game";

export const metadata: Metadata = {
  title: "Play | BOARD",
  description: "Enter Monopoly or Ludo. Four seats. One winner.",
};

type PlayPageProps = {
  searchParams: Promise<{ game?: string | string[] }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.game) ? params.game[0] : params.game;
  const initialGame = parsePreviewGame(raw) ?? "monopoly";

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col">
      <PlayStage initialGame={initialGame} />
    </main>
  );
}
