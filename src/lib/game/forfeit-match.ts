import { clearMatch } from "@/lib/game/match-storage";
import { clearPlaySeat, readPlaySeat } from "@/lib/game/play-table";

/**
 * Leave a match in progress. The sit fee stays with the house — no refund.
 */
export async function forfeitPlayMatch() {
  const seat = readPlaySeat();
  const tableId = seat?.tableId;
  const body: { leaveToken?: string; address?: string } = {};
  if (seat?.leaveToken) body.leaveToken = seat.leaveToken;
  if (seat?.address) body.address = seat.address;
  if (!tableId || (!body.leaveToken && !body.address)) {
    clearPlaySeat();
    return;
  }
  try {
    await fetch(`/api/play/tables/${tableId}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Seat is cleared locally either way so the player can sit again.
  } finally {
    clearMatch(tableId);
    clearPlaySeat();
  }
}
