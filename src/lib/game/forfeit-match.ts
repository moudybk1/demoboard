import { clearMatch } from "@/lib/game/match-storage";
import { clearPlaySeat, readPlaySeat } from "@/lib/game/play-table";
import { recoverPlaySeat } from "@/lib/game/recover-play-seat";

/**
 * Leave a match in progress. The sit fee stays with the house. No refund.
 * `tableId` and `address` come from the open room so a missing session seat
 * still unseats the wallet on the server.
 */
export async function forfeitPlayMatch(input?: {
  tableId?: string;
  address?: string;
}) {
  const seat = readPlaySeat();
  const tableId = input?.tableId ?? seat?.tableId;
  const address = input?.address ?? seat?.address;
  const body: { leaveToken?: string; address?: string } = {};
  if (
    seat?.leaveToken &&
    (!input?.tableId || seat.tableId.toUpperCase() === input.tableId.toUpperCase())
  ) {
    body.leaveToken = seat.leaveToken;
  }
  if (address) body.address = address;
  if (!tableId || (!body.leaveToken && !body.address)) {
    clearPlaySeat();
    return false;
  }
  try {
    if (!body.leaveToken && address) {
      body.leaveToken = (await recoverPlaySeat(tableId, address)).leaveToken;
    }
    const response = await fetch(`/api/play/tables/${tableId}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      clearMatch(tableId);
      clearPlaySeat();
    }
    return response.ok;
  } catch {
    return false;
  }
}
