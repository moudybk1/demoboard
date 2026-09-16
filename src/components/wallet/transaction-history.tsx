"use client";

import { useMemo, useState } from "react";

import { BoardAmount } from "@/components/ui/board-amount";
import { MOCK_TRANSACTIONS, type MockTx } from "@/lib/mock/wallet";
import { cn, formatAge } from "@/lib/utils";

type TxFilter = "all" | MockTx["type"] | MockTx["status"];

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
  { id: "entry_fee", label: "Entry" },
  { id: "payout", label: "Payout" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

/**
 * Transaction history sorted newest-first with type/status filters (mock data).
 */
export function TransactionHistory({ className }: { className?: string }) {
  const [filter, setFilter] = useState<TxFilter>("all");
  const now = Date.parse("2026-09-13T12:00:00.000Z");

  const rows = useMemo(() => {
    const sorted = [...MOCK_TRANSACTIONS].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    if (filter === "all") return sorted;
    return sorted.filter(
      (tx) => tx.type === filter || tx.status === filter,
    );
  }, [filter]);

  return (
    <section
      aria-labelledby="tx-history-title"
      className={cn("border-2 border-edge bg-void/40 shadow-pixel", className)}
    >
      <div className="flex flex-col gap-3 border-b-2 border-edge bg-surface-raised/60 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="font-pixel text-xs uppercase tracking-[0.18em] text-gold">
            Ledger
          </p>
          <h2
            id="tx-history-title"
            className="mt-2 font-pixel text-[11px] text-parchment"
          >
            Transaction history
          </h2>
        </div>
        <p className="font-pixel text-xs uppercase text-faint">Newest first</p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b-2 border-edge px-4 py-3 sm:px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 border-2 px-3 py-1.5 font-pixel text-xs uppercase transition-colors",
              filter === item.id
                ? "border-gold bg-gold/15 text-gold"
                : "border-edge text-muted hover:border-edge-bright hover:text-parchment",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted sm:px-5">
          No transactions match this filter.
        </p>
      ) : (
        <ul className="divide-y-2 divide-edge">
          {rows.map((tx) => (
            <TxRow key={tx.id} tx={tx} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TxRow({ tx, now }: { tx: MockTx; now: number }) {
  const positive = tx.amount > 0;
  const statusTone =
    tx.status === "confirmed"
      ? "text-success"
      : tx.status === "pending"
        ? "text-gold"
        : "text-danger";

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-hover/40 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-pixel text-[10px] uppercase text-parchment">
            {tx.type.replace("_", " ")}
          </p>
          <span className={cn("font-pixel text-xs uppercase", statusTone)}>
            {tx.status}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted">{tx.note}</p>
        <p className="mt-1 text-[10px] text-faint">{formatAge(tx.createdAt, now)}</p>
      </div>
      <BoardAmount
        value={Math.abs(tx.amount)}
        tone={
          tx.status === "failed"
            ? "danger"
            : positive
              ? "gold"
              : "default"
        }
        showTicker={false}
        className={cn(!positive && tx.status !== "failed" && "opacity-90")}
      />
      <span className="w-full font-pixel text-xs uppercase text-faint sm:w-auto sm:text-right">
        {positive ? "in" : "out"}
      </span>
    </li>
  );
}
