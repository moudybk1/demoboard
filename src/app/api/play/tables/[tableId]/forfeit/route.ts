import { requirePlayWallet } from "@/server/lib/require-play-wallet";
import { NextResponse } from "next/server";

import {
  errorResponse,
  failureResponse,
  InvalidBodyError,
  readJsonBody,
  readOptionalString,
} from "@/server/lib/api-response";
import { forfeitPlayTable } from "@/server/services/play-table.service";

type RouteContext = {
  params: Promise<{ tableId: string }>;
};

/** POST /api/play/tables/[tableId]/forfeit · quit a live match. No refund. */
export async function POST(request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  if (!tableId) {
    return NextResponse.json({ error: "Missing table id." }, { status: 400 });
  }

  try {
    const body = await readJsonBody(request);
    const leaveToken = readOptionalString(body, "leaveToken");
    const address = await requirePlayWallet(request, readOptionalString(body, "address"));
    if (!leaveToken && !address) {
      throw new InvalidBodyError("leaveToken or address is required.", 400);
    }
    const result = await forfeitPlayTable({
      tableId,
      leaveToken: leaveToken ?? undefined,
      address: address ?? undefined,
    });
    if (!result.ok) return failureResponse(result);
    return NextResponse.json({ table: result.table });
  } catch (error) {
    return errorResponse(error, "POST /api/play/tables/:tableId/forfeit");
  }
}
