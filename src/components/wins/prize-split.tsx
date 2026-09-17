import { Flame, Landmark } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

export type PrizeSplitValues = {
  grossPot: number;
  feePercent: number;
  treasuryAmount: number;
  burnAmount: number;
  netPayout: number;
};

/**
 * Shared breakdown of gross pot → treasury fee / burn → net winner payout.
 */
export function PrizeSplit({
  values,
  className,
  compact = false,
}: {
  values: PrizeSplitValues;
  className?: string;
  compact?: boolean;
}) {
  return (
    <PixelCard
      as="dl"
      size="sm"
      tone="ink"
      className={className}
      faceClassName={cn("space-y-2 p-4", compact ? "text-[11px]" : "text-sm")}
    >
      <SplitRow label="Gross pot" value={values.grossPot} compact={compact} />
      <SplitRow
        label={`Fee (${values.feePercent}%) → treasury`}
        value={values.treasuryAmount}
        icon={<Landmark className={compact ? "size-3" : "size-3.5"} aria-hidden />}
        compact={compact}
      />
      <SplitRow
        label="Burned"
        value={values.burnAmount}
        tone="danger"
        icon={<Flame className={compact ? "size-3" : "size-3.5"} aria-hidden />}
        compact={compact}
      />
      <SplitRow
        label="Winner receives"
        value={values.netPayout}
        tone="gold"
        emphasize
        compact={compact}
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
}: {
  label: string;
  value: number;
  tone?: "muted" | "gold" | "danger";
  icon?: React.ReactNode;
  emphasize?: boolean;
  compact?: boolean;
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
          showTicker={!compact}
        />
      </dd>
    </div>
  );
}
