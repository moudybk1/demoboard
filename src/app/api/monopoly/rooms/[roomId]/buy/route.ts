import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import {
  errorResponse,
  failureResponse,
  readJsonBody,
  readOptionalInteger,
} from "@/server/lib/api-response";
import { requireUser } from "@/server/lib/require-user";
import { buyMonopolyProperty } from "@/server/services/monopoly-buy.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

const TILE_RANGE = { min: 0, max: 39 };

/**
 * POST /api/monopoly/rooms/[roomId]/buy · buy the tile the pawn is standing on.
 *
 * Body (optional): `{ tileIndex?: number }`
 */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "monopoly", "buy");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const { userId } = await requireUser(request);
    const body = await readJsonBody(request);
    const tileIndex = readOptionalInteger(body, "tileIndex", TILE_RANGE);

    const result = await buyMonopolyProperty(roomId, userId, tileIndex);
    if (!result.ok) return failureResponse(result);

    return NextResponse.json({
      tileIndex: result.tileIndex,
      tileName: result.tileName,
      price: result.price,
      seat: result.seat,
      cashAfter: result.cashAfter,
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    return errorResponse(error, "POST /api/monopoly/rooms/:roomId/buy");
  }
}
