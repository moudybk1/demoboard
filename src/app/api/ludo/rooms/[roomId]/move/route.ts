import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import {
  errorResponse,
  failureResponse,
  readJsonBody,
} from "@/server/lib/api-response";
import { requireUser } from "@/server/lib/require-user";
import { moveLudoPawn } from "@/server/services/ludo-move.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/** Pull a non-empty `pawnId` out of an unvalidated JSON body. */
function readPawnId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { pawnId } = body as Record<string, unknown>;
  if (typeof pawnId !== "string") return null;
  return pawnId.trim() || null;
}

/**
 * POST /api/ludo/rooms/[roomId]/move · move a pawn after an authoritative roll.
 *
 * Body: `{ "pawnId": "p1-0" }`
 */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "ludo", "move");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  const pawnId = readPawnId(await readJsonBody(request));
  if (!pawnId) {
    return NextResponse.json(
      { error: "Body must include pawnId." },
      { status: 400 },
    );
  }

  try {
    const { userId } = await requireUser(request);
    const result = await moveLudoPawn(roomId, userId, pawnId);
    if (!result.ok) return failureResponse(result);

    return NextResponse.json({
      pawnId: result.pawnId,
      seat: result.seat,
      roll: result.roll,
      captures: result.captures,
      extraTurn: result.extraTurn,
      won: result.won,
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    return errorResponse(error, "POST /api/ludo/rooms/:roomId/move");
  }
}
