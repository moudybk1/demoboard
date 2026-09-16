"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PayoutStatusBadge } from "@/components/wins/payout-status-badge";
import {
  MOCK_WIN_HISTORY,
  type MockWinResult,
} from "@/lib/mock/wins";
import { cn, formatAge } from "@/lib/utils";

const NOW = Date.parse("2026-09-13T12:00:00.000Z");

/**
 * Win history as a felt trophy board — not a flat spreadsheet list.
 */
export function WinHistoryList({
  wins = MOCK_WIN_HISTORY,
  className,
}: {
  wins?: MockWinResult[];
  className?: string;
}) {
  const sorted = [...wins].sort(
    (a, b) => Date.parse(b.settledAt) - Date.parse(a.settledAt),
  );

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          "border-2 border-edge bg-void/50 px-5 py-10 text-center text-sm text-muted",
          className,
        )}
      >
        No wins yet. Sit a table in the lobby to start a run.
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {sorted.map((win) => (
        <WinCard key={win.id} win={win} />
      ))}
    </ul>
  );
}

function WinCard({ win }: { win: MockWinResult }) {
  const yours = win.winner.isYou;
  const accent =
    win.gameType === "monopoly"
      ? "border-monopoly/45 hover:border-monopoly/70"
      : "border-ludo/45 hover:border-ludo/70";
  const bar =
    win.gameType === "monopoly" ? "bg-monopoly" : "bg-ludo";

  return (
    <li>
      <Link
        href="/result"
        className={cn(
          "group flex h-full flex-col overflow-hidden border-2 bg-void/55 shadow-pixel transition-[transform,box-shadow,border-color] duration-[var(--duration-fast)] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-pixel-lg",
          accent,
        )}
      >
        <div aria-hidden className={cn("h-1 w-full", bar)} />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-pixel text-[10px] capitalize text-parchment">
                {win.gameType}
              </p>
              <p className="mt-1 truncate text-xs text-faint">{win.roomId}</p>
            </div>
            <Trophy
              className={cn(
                "size-4 shrink-0",
                yours ? "text-gold" : "text-faint",
              )}
              aria-hidden
            />
          </div>

          <p className="text-xs text-muted">
            {yours ? "You won" : `${win.winner.username} won`} ·{" "}
            {formatAge(win.settledAt, NOW)}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 border-t-2 border-edge pt-3">
            <PayoutStatusBadge status={win.payoutStatus} />
            <div className="text-right">
              <BoardAmount
                value={win.netPayout}
                size="sm"
                tone={yours ? "gold" : "muted"}
              />
              <p className="mt-1 font-pixel text-xs uppercase text-faint">
                Net
              </p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
