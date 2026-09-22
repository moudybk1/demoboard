import { paidGameRoute } from "@/server/lib/paid-game-route";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  return await paidGameRoute(request, roomId, "monopoly", "end-turn")
    ?? Response.json({ error: "Table not found." }, { status: 404 });
}
