import { NextResponse } from "next/server";

import {
  errorResponse,
  failureResponse,
  InvalidBodyError,
  readJsonBody,
  readOptionalString,
} from "@/server/lib/api-response";
import { readyPlayTable } from "@/server/services/play-table.service";

type RouteContext = {
  params: Promise<{ tableId: string }>;
};

/** POST /api/play/tables/[tableId]/ready · mark ready; start when 4 are ready. */
export async function POST(request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  if (!tableId) {
    return NextResponse.json({ error: "Missing table id." }, { status: 400 });
  }

  try {
    const body = await readJsonBody(request);
    const leaveToken = readOptionalString(body, "leaveToken");
    if (!leaveToken) {
      throw new InvalidBodyError("leaveToken is required.", 400);
    }
    const result = await readyPlayTable({ tableId, leaveToken });
    if (!result.ok) return failureResponse(result);
    return NextResponse.json({ table: result.table });
  } catch (error) {
    return errorResponse(error, "POST /api/play/tables/:tableId/ready");
  }
}
