import { NextResponse } from "next/server";

import { readJsonBody, readOptionalString } from "@/server/lib/api-response";
import {
  getPlayTable,
  resumePlayTable,
} from "@/server/services/play-table.service";

type RouteContext = {
  params: Promise<{ tableId: string }>;
};

export const maxDuration = 20;

/** GET /api/play/tables/[tableId] · waiting / playing table snapshot. */
export async function GET(_request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  if (!tableId) {
    return NextResponse.json({ error: "Missing table id." }, { status: 400 });
  }
  const table = getPlayTable(tableId);
  if (!table) {
    return NextResponse.json(
      { error: "Table not found.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  return NextResponse.json({ table });
}

/**
 * POST /api/play/tables/[tableId]
 * Reattach a paid seat on this instance. The body carries the sit proof
 * from the browser that paid, so a different serverless instance can
 * rebuild the table.
 */
export async function POST(request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  if (!tableId) {
    return NextResponse.json({ error: "Missing table id." }, { status: 400 });
  }
  const body = await readJsonBody(request);
  const result = await resumePlayTable({
    tableId,
    leaveToken: readOptionalString(body, "leaveToken"),
    address: readOptionalString(body, "address"),
    txHash: readOptionalString(body, "txHash"),
  });
  if (!result.table) {
    return NextResponse.json(
      { error: "Table not found.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    table: result.table,
    note: result.note,
    blocked: result.blocked,
  });
}
