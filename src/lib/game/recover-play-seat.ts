import { savePlaySeat, type PlaySeatRecord } from "@/lib/game/play-table";
import { readResponseJson } from "@/lib/fetch-json";

export async function recoverPlaySeat(tableId: string, address: string): Promise<PlaySeatRecord> {
  const response = await fetch(`/api/play/tables/${encodeURIComponent(tableId)}/recover`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }),
  });
  const payload = await readResponseJson(response) as (PlaySeatRecord & { error?: string }) | null;
  if (!response.ok || !payload?.leaveToken) throw new Error(payload?.error ?? "Could not recover this seat.");
  savePlaySeat(payload);
  return payload;
}
