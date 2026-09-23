import { Flame, Landmark, RefreshCw } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

export type PrizeSplitValues = {
  grossPot: number;
  feePercent: number;
  treasuryAmount: number;
  buybackAmount: number;
  burnAmount: number;
  netPayout: number;
};

/**
 * Shared breakdown of gross pot → development / buyback / burn → net winner.
 */
export function PrizeSplit({
  values,
  className,
  compact = false,
  ticker = "USDG",
  allocationsOnly = false,
  retainedFeeOnly = false,
}: {
  values: PrizeSplitValues;
  className?: string;
  compact?: boolean;
  ticker?: string;
  allocationsOnly?: boolean;
  retainedFeeOnly?: boolean;
}) {
  return (
    <PixelCard
      as="dl"
      size="sm"
      tone="ink"
      className={className}
      faceClassName={cn("space-y-2 p-4", compact ? "text-[11px]" : "text-sm")}
    >
      <SplitRow label="Gross pot" value={values.grossPot} compact={compact} ticker={ticker} />
      <SplitRow
        label={`Fee (${values.feePercent}%) → ${retainedFeeOnly ? "treasury" : "development"}`}
        value={values.treasuryAmount}
        icon={
          <Landmark className={compact ? "size-3" : "size-3.5"} aria-hidden />
        }
        compact={compact}
        ticker={ticker}
      />
      {!retainedFeeOnly && <><SplitRow
        label="Buyback"
        value={values.buybackAmount}
        icon={
          <RefreshCw className={compact ? "size-3" : "size-3.5"} aria-hidden />
        }
        compact={compact}
        ticker={ticker}
      />
      <SplitRow
        label={allocationsOnly ? "Burn allocation" : "Burned"}
        value={values.burnAmount}
        tone="danger"
        icon={<Flame className={compact ? "size-3" : "size-3.5"} aria-hidden />}
        compact={compact}
        ticker={ticker}
      /></>}
      <SplitRow
        label={allocationsOnly ? "Winner allocation" : "Winner receives"}
        value={values.netPayout}
        tone="gold"
        emphasize
        compact={compact}
        ticker={ticker}
      />
    </PixelCard>
  );
}

function SplitRow({
  label,
  value,
  tone = "muted",
  icon,
  emphasize = false,
  compact = false,
  ticker = "USDG",
}: {
  label: string;
  value: number;
  tone?: "muted" | "gold" | "danger";
  icon?: React.ReactNode;
  emphasize?: boolean;
  compact?: boolean;
  ticker?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        emphasize && "border-t-2 border-edge pt-3",
      )}
    >
      <dt className="flex items-center gap-1.5 text-faint">
        {icon}
        {label}
      </dt>
      <dd>
        <BoardAmount
          value={value}
          size={emphasize && !compact ? "sm" : "xs"}
          tone={tone}
          ticker={ticker}
          showTicker={!compact}
        />
      </dd>
    </div>
  );
}
