import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { parsePreviewGame, playPathForGame } from "@/lib/preview-game";

export const metadata: Metadata = {
  title: "Lobby | BOARD",
  description: "Connect a wallet and play Ludo. Monopoly is a work in progress.",
};

type LobbyPageProps = {
  searchParams: Promise<{ game?: string | string[] }>;
};

export default async function LobbyPage({ searchParams }: LobbyPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.game) ? params.game[0] : params.game;
  const game = parsePreviewGame(raw);
  redirect(game ? playPathForGame(game) : "/play");
}
