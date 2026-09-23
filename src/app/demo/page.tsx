import { redirect } from "next/navigation";

import { parsePreviewGame, playPathForGame } from "@/lib/preview-game";

type DemoPageProps = {
  searchParams: Promise<{ game?: string | string[] }>;
};

/** Legacy /demo links land on play. */
export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.game) ? params.game[0] : params.game;
  const game = parsePreviewGame(raw);
  redirect(game ? playPathForGame(game) : "/play");
}
