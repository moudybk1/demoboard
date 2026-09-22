import { paidGameRoute } from "@/server/lib/paid-game-route";
import { NextResponse } from "next/server";

import { errorResponse, failureResponse } from "@/server/lib/api-response";
import { requireUser } from "@/server/lib/require-user";
import { settleMonopolyWinner } from "@/server/services/monopoly-settle.service";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * POST /api/monopoly/rooms/[roomId]/settle · declare winner & pay net prize.
 *
 * Requires exactly one living player, and a caller seated in that match.
 * Applies the fee, credits the winner, and marks the match settled.
 */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const paid = await paidGameRoute(request, roomId, "monopoly", "settle");
  if (paid) return paid;
  if (!roomId) {
    return NextResponse.json({ error: "Missing room id." }, { status: 400 });
  }

  try {
    const { userId } = await requireUser(request);
    const result = await settleMonopolyWinner(roomId, userId);
    if (!result.ok) return failureResponse(result);

    return NextResponse.json({
      winnerUserId: result.winnerUserId,
      winnerSeat: result.winnerSeat,
      winnerUsername: result.winnerUsername,
      prizePool: result.prizePool,
      fee: result.fee,
      netPrize: result.netPrize,
      balanceAfter: result.balanceAfter,
      state: result.state,
      source: result.source,
    });
  } catch (error) {
    return errorResponse(error, "POST /api/monopoly/rooms/:roomId/settle");
  }
}
