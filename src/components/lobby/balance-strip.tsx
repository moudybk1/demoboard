import { Link2, Lock } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelBadge } from "@/components/ui/pixel-badge";
import { PixelLabel } from "@/components/ui/pixel-label";
import { PLAY_IS_LIVE, SAMPLE_DATA_LABEL } from "@/lib/platform-status";
import type { WalletBalance } from "@/lib/types";
import { formatBoard } from "@/lib/utils";

function shortAddress(address: string) {
  if (!address || address.length < 10) return "...";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Balance vault strip. Stakes at a glance before joining a room. */
export function BalanceStrip({
  balance,
  cheapestEntryFee,
  className,
}: {
  balance: WalletBalance;
  cheapestEntryFee?: number;
  className?: string;
}) {
  // A shortfall warning against a sample balance would be inventing a problem,
  // so it only appears once staking is live.
  const cannotPlay =
    PLAY_IS_LIVE &&
    cheapestEntryFee !== undefined &&
    balance.available < cheapestEntryFee;

  return (
    <PixelCard
      as="section"
      size="lg"
      tone="gold"
      className={className}
      faceClassName="relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-24 bg-gold-deep/20"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PixelLabel className="text-gold/80">Available to stake</PixelLabel>
          {PLAY_IS_LIVE ? (
            <PixelBadge tone="gold">Ready</PixelBadge>
          ) : (
            <PixelBadge tone="neutral">{SAMPLE_DATA_LABEL}</PixelBadge>
          )}
        </div>
        <BoardAmount
          value={balance.available}
          size="xl"
          tone="default"
          className="mt-3"
        />
        {!PLAY_IS_LIVE ? (
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Not a real balance. Connect a wallet once staking is live to see
            yours.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <PixelLabel className="flex items-center gap-1.5 text-faint">
              <Lock className="size-3" aria-hidden />
              Locked in rooms
            </PixelLabel>
            <BoardAmount
              value={balance.locked}
              tone="muted"
              showTicker={false}
              className="mt-1.5"
            />
          </div>
          <div className="border-l-2 border-edge pl-4">
            <PixelBadge tone="gold">
              <Link2 className="size-3" aria-hidden />
              {balance.chain}
            </PixelBadge>
            <p className="mt-2 font-pixel text-xs font-semibold text-faint">
              {shortAddress(balance.address)}
            </p>
          </div>
        </div>
      </div>

      {cannotPlay ? (
        <p
          role="alert"
          className="border-t-2 border-danger/40 bg-danger/10 px-5 py-3 text-xs text-danger sm:px-6"
        >
          Balance is below the cheapest open table (
          {formatBoard(cheapestEntryFee)} BOARD).
        </p>
      ) : null}
    </PixelCard>
  );
}
