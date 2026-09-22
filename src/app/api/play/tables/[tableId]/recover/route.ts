import { NextResponse } from "next/server";
import { requirePlayWallet } from "@/server/lib/require-play-wallet";
import { errorResponse, readJsonBody, readOptionalString } from "@/server/lib/api-response";
import { recoverPlaySeat } from "@/server/services/play-table.service";

export async function POST(request: Request, context: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await context.params;
    const body = await readJsonBody(request);
    const address = await requirePlayWallet(request, readOptionalString(body, "address"));
    return NextResponse.json(await recoverPlaySeat(tableId, address));
  } catch (error) { return errorResponse(error, "POST play seat recovery"); }
}
