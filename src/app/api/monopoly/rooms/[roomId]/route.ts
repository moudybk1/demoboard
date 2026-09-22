import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import { getMonopolyState } from "@/server/services/monopoly-state.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * GET /api/monopoly/rooms/[roomId] · current Monopoly board snapshot.
 */
export async function GET(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "monopoly");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const result = await getMonopolyState(roomId);
    if (!result) {
      return NextResponse.json(
        { error: "Monopoly room not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    console.error("[GET /api/monopoly/rooms/:roomId]", error);
    return NextResponse.json(
      { error: "Failed to load Monopoly state." },
      { status: 500 },
    );
  }
}
