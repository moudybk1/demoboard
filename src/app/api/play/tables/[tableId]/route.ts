import { NextResponse } from "next/server";

import { getPlayTable } from "@/server/services/play-table.service";

type RouteContext = {
  params: Promise<{ tableId: string }>;
};

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
