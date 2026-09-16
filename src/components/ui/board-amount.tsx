import { cva, type VariantProps } from "class-variance-authority";

import { cn, formatBoard, formatBoardCompact } from "@/lib/utils";

const amount = cva("font-pixel font-bold tabular-nums", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-3xl",
    },
    tone: {
      default: "text-parchment",
      gold: "text-gold-deep",
      muted: "text-muted",
      success: "text-success",
      danger: "text-danger",
    },
  },
  defaultVariants: { size: "md", tone: "default" },
});

const TICKER_SIZE = {
  xs: "text-xs",
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
} as const;

/**
 * Canonical way to render a BOARD token amount. Keeps grouping, decimals, and
 * the ticker consistent everywhere, and always exposes the exact value to
 * screen readers even when the visible text is abbreviated.
 */
export function BoardAmount({
  value,
  size = "md",
  tone = "default",
  /** Abbreviate large values ("12.5K") · for nav chips and other tight spots. */
  compact = false,
  /** Prefix with an explicit +/- , for ledger-style rows. */
  signed = false,
  showTicker = true,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof amount> & {
    value: number;
    compact?: boolean;
    signed?: boolean;
    showTicker?: boolean;
  }) {
  const magnitude = Math.abs(value);
  const sign = signed && value !== 0 ? (value > 0 ? "+" : "−") : "";
  const exact = `${sign}${formatBoard(magnitude)}`;
  const text = compact ? `${sign}${formatBoardCompact(magnitude)}` : exact;

  return (
    <span
      className={cn("inline-flex items-baseline gap-1", className)}
      title={`${exact} BOARD`}
      {...props}
    >
      {/* "12.5K" is ambiguous read aloud, so the exact value is kept for
          screen readers whenever the visible text is abbreviated. */}
      <span className={amount({ size, tone })} aria-hidden={compact}>
        {text}
      </span>
      {compact && <span className="sr-only">{exact}</span>}

      {showTicker && (
        <span
          className={cn(
            "font-pixel font-semibold opacity-70",
            amount({ size, tone }),
            TICKER_SIZE[size ?? "md"],
          )}
        >
          BOARD
        </span>
      )}
    </span>
  );
}
