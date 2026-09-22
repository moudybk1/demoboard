import { NextResponse } from "next/server";

import { PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import { listPlayLobby } from "@/server/services/play-table.service";

/** GET /api/play/lobby · live occupancy for Monopoly and Ludo sit tables. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = url.searchParams.get("address");
    const address =
      raw && /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : null;
    return NextResponse.json({
      games: listPlayLobby(address),
      symbol: PLAY_STAKE_SYMBOL,
    });
  } catch (error) {
    console.error("[play-lobby]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load the lobby.",
        games: [],
        symbol: PLAY_STAKE_SYMBOL,
      },
      { status: 500 },
    );
  }
}
