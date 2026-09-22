import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import { errorResponse, failureResponse } from "@/server/lib/api-response";
import { requireUser } from "@/server/lib/require-user";
import { rollLudo } from "@/server/services/ludo-roll.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/** POST /api/ludo/rooms/[roomId]/roll · authoritative single-die roll. */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "ludo", "roll");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const { userId } = await requireUser(request);
    const result = await rollLudo(roomId, userId);
    if (!result.ok) return failureResponse(result);

    return NextResponse.json({
      roll: result.roll,
      seat: result.seat,
      legalMoves: result.legalMoves,
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    return errorResponse(error, "POST /api/ludo/rooms/:roomId/roll");
  }
}
