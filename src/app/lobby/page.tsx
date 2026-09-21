import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { parsePreviewGame, playPathForGame } from "@/lib/preview-game";

export const metadata: Metadata = {
  title: "Lobby | BOARD",
  description: "Connect a wallet, pick Monopoly or Ludo, and sit a table.",
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
