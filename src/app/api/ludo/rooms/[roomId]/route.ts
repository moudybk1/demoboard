import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import { getLudoState } from "@/server/services/ludo-state.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * GET /api/ludo/rooms/[roomId] · current Ludo board snapshot.
 */
export async function GET(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "ludo");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const result = await getLudoState(roomId);
    if (!result) {
      return NextResponse.json(
        { error: "Ludo room not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    console.error("[GET /api/ludo/rooms/:roomId]", error);
    return NextResponse.json(
      { error: "Failed to load Ludo state." },
      { status: 500 },
    );
  }
}
