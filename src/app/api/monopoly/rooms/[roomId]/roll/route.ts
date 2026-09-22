import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import { errorResponse, failureResponse } from "@/server/lib/api-response";
import { requireUser } from "@/server/lib/require-user";
import { rollMonopoly } from "@/server/services/monopoly-roll.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/** POST /api/monopoly/rooms/[roomId]/roll · authoritative dice + pawn move. */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "monopoly", "roll");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const { userId } = await requireUser(request);
    const result = await rollMonopoly(roomId, userId);
    if (!result.ok) return failureResponse(result);

    return NextResponse.json({
      dice: result.dice,
      total: result.total,
      isDouble: result.isDouble,
      fromTile: result.fromTile,
      toTile: result.toTile,
      tileName: result.tileName,
      tileKind: result.tileKind,
      canBuy: result.canBuy,
      rent: result.rent ?? null,
      seat: result.seat,
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    return errorResponse(error, "POST /api/monopoly/rooms/:roomId/roll");
  }
}
