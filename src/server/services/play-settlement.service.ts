import type { Hex } from "viem";
import type { LiveMatch } from "@/lib/game/live-match";
import { ServiceError } from "@/server/lib/service-error";
import { withPlayDocument } from "@/server/lib/play-store";
import { updatePaidMatch } from "@/server/services/play-table.service";
import {
  assertPlayTransfer,
  broadcastPlayTransfer,
  playTransferReceipt,
  preparePlayTransfer,
  type SignedPlayTransfer,
} from "@/server/lib/play-chain";

/** Short, non-nested transactions; the nonce journal commits before any send. */
export async function settlePaidMatch(snapshot: LiveMatch): Promise<LiveMatch> {
  const match = await updatePaidMatch(snapshot.id, (current) => structuredClone(current));
  if (match.winnerSeat === null || !match.settlement)
    throw new ServiceError("This match has no winner yet.", 409);
  const settlement = match.settlement;
  if (settlement.status === "confirmed" || settlement.status === "house") return match;
  const winner = match.state.players.find((player) => player.position === match.winnerSeat)!;
  try {
    const saved = await withPlayDocument<{ transfer?: SignedPlayTransfer }, SignedPlayTransfer | undefined>(
      `play-payout-${match.id}`, () => ({}), async (intent) => intent.transfer,
    );
    // Preserve old per-match intents too: an upgrade must not allocate a second nonce.
    const prepared = saved ?? await preparePlayTransfer(winner.id as Hex, settlement.netPayout, `payout:${match.id}`);
    await assertPlayTransfer(prepared, winner.id as Hex, settlement.netPayout);
    const transfer = await withPlayDocument<{ transfer?: SignedPlayTransfer }, SignedPlayTransfer>(
      `play-payout-${match.id}`, () => ({}), async (intent) => {
        intent.transfer ??= prepared;
        return intent.transfer;
      },
    );
    await assertPlayTransfer(transfer, winner.id as Hex, settlement.netPayout);
    let status = await playTransferReceipt(transfer.hash);
    if (status === "pending") {
      await broadcastPlayTransfer(transfer).catch(() => undefined);
      status = await playTransferReceipt(transfer.hash);
    }
    return updatePaidMatch(match.id, (current) => {
      if (current.settlement?.status === "confirmed") return structuredClone(current);
      current.settlement = {
        ...current.settlement!, txHash: transfer.hash,
        status: status === "pending" ? "submitted" : status,
        confirmedAt: status === "confirmed" ? new Date().toISOString() : null,
        error: status === "failed" ? "Payout reverted. Support must reconcile the saved transaction; do not pay entry again." : null,
      };
      current.version += 1;
      return structuredClone(current);
    });
  } catch {
    return updatePaidMatch(match.id, (current) => {
      if (current.settlement?.status === "confirmed") return structuredClone(current);
      current.settlement = { ...current.settlement!, status: "failed", error: "Payout needs recovery. Your result and any signed transfer are saved; retry safely." };
      current.version += 1;
      return structuredClone(current);
    });
  }
}
