import { setTimeout } from "node:timers/promises";
import { maintainPaidPlay, flushPendingRefunds, hasRefundRecoveryBlockers } from "../src/server/services/play-table.service";
import { settlePaidMatch } from "../src/server/services/play-settlement.service";
import { getPlayTreasuryStatus, reconcileTreasuryTransfers } from "../src/server/lib/play-chain";
import { recordPlayWorkerHealth } from "../src/server/lib/play-readiness";

// Run as a supervised, long-lived process with the SAME database/network/key as
// the web app. Secrets are injected by the process manager, never read from files.
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

async function gameplay() {
  while (!stopping) {
    try {
      await maintainPaidPlay();
      await recordPlayWorkerHealth("gameplay");
    } catch { console.error("[play-worker] Gameplay maintenance failed; entries will pause."); }
    await setTimeout(1000);
  }
}

async function payments() {
  while (!stopping) {
    try {
      const recovery = await reconcileTreasuryTransfers();
      await flushPendingRefunds();
      const matches = await maintainPaidPlay();
      const outcomes = await Promise.all(matches.map(settlePaidMatch));
      const treasury = await getPlayTreasuryStatus();
      const failed = recovery.failures.length || outcomes.some((match) => match.settlement?.status === "failed") || !treasury.canRefund || await hasRefundRecoveryBlockers();
      await recordPlayWorkerHealth("payments", failed ? "Treasury reconciliation or gas funding needs operator attention." : null);
    } catch {
      console.error("[play-worker] Payment maintenance failed; saved intents remain retryable.");
      await recordPlayWorkerHealth("payments", "Payment worker needs recovery.").catch(() => undefined);
    }
    await setTimeout(5000);
  }
}

Promise.all([gameplay(), payments()]).then(() => process.exit(0)).catch(() => process.exit(1));
