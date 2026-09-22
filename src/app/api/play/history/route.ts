import { NextResponse } from "next/server";
import { requirePlayWallet } from "@/server/lib/require-play-wallet";
import { errorResponse } from "@/server/lib/api-response";
import { getPaidPlayHistory } from "@/server/services/play-table.service";

export async function GET(request: Request) {
  try {
    const address = await requirePlayWallet(request, new URL(request.url).searchParams.get("address") ?? undefined);
    return NextResponse.json(await getPaidPlayHistory(address), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error, "GET paid history"); }
}
