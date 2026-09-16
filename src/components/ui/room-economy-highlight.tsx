import { Coins, Flame, Landmark, Trophy, Wallet } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelLabel } from "@/components/ui/pixel-label";
import { PixelPanel } from "@/components/ui/pixel-panel";
import { PRIZE_FEE_RATE, netPrize, prizePool } from "@/lib/types";
import { cn } from "@/lib/utils";

export type RoomEconomyProps = {
  entryFee: number;
  seats?: number;
  /** Optional available balance for affordability contrast. */
  balance?: number;
  className?: string;
  /** Compact strip for headers; full panel for lobby / sidebars. */
  variant?: "strip" | "panel";
};

/**
 * Makes entry fee, pot, net prize, and the 2% treasury/burn fee impossible to miss.
 */
export function RoomEconomyHighlight({
  entryFee,
  seats = 4,
  balance,
  className,
  variant = "panel",
}: RoomEconomyProps) {
  const gross = prizePool({ entryFee, maxPlayers: seats });
  const net = netPrize({ entryFee, maxPlayers: seats });
  const fee = Math.round((gross - net) * 100) / 100;
  const treasury = Math.round((fee / 2) * 100) / 100;
  const burn = Math.round((fee - treasury) * 100) / 100;
  const feePercent = Math.round(PRIZE_FEE_RATE * 100);
  const canAfford = balance === undefined || balance >= entryFee;

  if (variant === "strip") {
    return (
      <div
        className={cn(
          "pixel-corners flex flex-wrap items-center gap-x-3 gap-y-2 border-[3px] border-void bg-cream px-3 py-2",
          className,
        )}
      >
        <Metric
          icon={<Coins className="size-3 text-muted" aria-hidden />}
          label="Entry"
          value={entryFee}
          tone={canAfford ? "default" : "danger"}
        />
        <Metric
          icon={<Trophy className="size-3 text-gold" aria-hidden />}
          label="Pot"
          value={gross}
          tone="gold"
        />
        <Metric
          icon={<Trophy className="size-3 text-gold" aria-hidden />}
          label="Net"
          value={net}
          tone="gold"
          emphasize
        />
        <span className="font-pixel text-xs font-bold uppercase text-faint">
          −{feePercent}% fee
        </span>
        {balance !== undefined && (
          <Metric
            icon={<Wallet className="size-3 text-muted" aria-hidden />}
            label="You"
            value={balance}
            tone={canAfford ? "default" : "danger"}
          />
        )}
      </div>
    );
  }

  return (
    <PixelPanel tone="gold" className={cn("overflow-hidden", className)}>
      <div className="border-b-[3px] border-void bg-gold/40 px-4 py-3">
        <PixelLabel className="text-void">Room economy</PixelLabel>
        <p className="mt-1 text-xs text-muted">
          {seats} seats · {feePercent}% prize fee → treasury + burn
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <EconomyCell
          icon={<Coins className="size-3.5" aria-hidden />}
          label="Entry fee"
          value={entryFee}
          tone={canAfford ? "default" : "danger"}
        />
        <EconomyCell
          icon={<Trophy className="size-3.5 text-gold" aria-hidden />}
          label="Gross pot"
          value={gross}
          tone="gold"
        />
        <EconomyCell
          icon={<Landmark className="size-3.5 text-muted" aria-hidden />}
          label="Treasury"
          value={treasury}
          tone="muted"
        />
        <EconomyCell
          icon={<Flame className="size-3.5 text-danger" aria-hidden />}
          label="Burn"
          value={burn}
          tone="danger"
        />
      </div>

      <div className="border-t-[3px] border-void bg-gold px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-pixel text-xs font-bold uppercase text-void">
            Winner receives
          </span>
          <BoardAmount value={net} size="lg" tone="default" />
        </div>
        {balance !== undefined && (
          <p
            className={cn(
              "mt-2 font-pixel text-xs font-bold uppercase",
              canAfford ? "text-success" : "text-danger",
            )}
          >
            Your balance{" "}
            <BoardAmount
              value={balance}
              size="xs"
              tone={canAfford ? "success" : "danger"}
              showTicker={false}
            />
            {canAfford ? " · enough to join" : " · deposit needed"}
          </p>
        )}
      </div>
    </PixelPanel>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
  emphasize,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "gold" | "danger";
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-pixel text-[11px] uppercase text-faint">{label}</span>
      <BoardAmount
        value={value}
        size={emphasize ? "sm" : "xs"}
        tone={tone}
        showTicker={false}
      />
    </div>
  );
}

function EconomyCell({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "gold" | "danger" | "muted";
}) {
  return (
    <div className="pixel-corners border-[3px] border-void bg-cream px-3 py-2.5">
      <p className="flex items-center gap-1.5 font-pixel text-xs font-bold uppercase text-faint">
        {icon}
        {label}
      </p>
      <BoardAmount value={value} size="md" tone={tone} className="mt-1.5" />
    </div>
  );
}
