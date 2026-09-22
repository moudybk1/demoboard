import { clearMatch } from "@/lib/game/match-storage";
import { clearPlaySeat, readPlaySeat } from "@/lib/game/play-table";

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
    const response = await fetch(`/api/play/tables/${tableId}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearMatch(tableId);
    clearPlaySeat();
  }
}
