import { NextResponse } from "next/server";

import { PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import { listPlayLobby } from "@/server/services/play-table.service";

/** GET /api/play/lobby · live occupancy for Monopoly and Ludo sit tables. */
export async function GET() {
  return NextResponse.json({
    games: listPlayLobby(),
    symbol: PLAY_STAKE_SYMBOL,
  });
}
