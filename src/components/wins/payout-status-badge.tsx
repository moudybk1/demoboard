import type { WinPayoutStatus } from "@/lib/mock/wins";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const COPY: Record<
  WinPayoutStatus,
  { label: string; body: string; className: string }
> = {
  paid: {
    label: "Paid",
    body: "Net BOARD was credited to your platform balance. Withdraw anytime from Wallet.",
    className: "border-success/50 bg-success/10 text-success",
  },
  pending: {
    label: "Pending",
    body: "Settlement is waiting on the payout worker. Your balance will update when it clears.",
    className: "border-gold/50 bg-gold/10 text-gold",
  },
  failed: {
    label: "Failed",
    body: "This payout did not credit. If you were the winner, retry from support or replay the settle.",
    className: "border-danger/50 bg-danger/10 text-danger",
  },
};

/**
 * Compact payout status chip for lists.
 */
export function PayoutStatusBadge({
  status,
  className,
}: {
  status: WinPayoutStatus;
  className?: string;
}) {
  const copy = COPY[status];
  return (
    <span
      className={cn(
        "pixel-corners inline-flex border px-2 py-1 font-pixel text-xs uppercase tracking-wide",
        copy.className,
        className,
      )}
    >
      {copy.label}
    </span>
  );
}

/**
 * Expanded paid / pending / failed banner for the win result page.
 */
export function PayoutStatusBanner({
  status,
  className,
}: {
  status: WinPayoutStatus;
  className?: string;
}) {
  const copy = COPY[status];
  return (
    <PixelCard
      role="status"
      size="sm"
      stroke={
        status === "paid" ? "void" : status === "failed" ? "danger" : "gold"
      }
      className={className}
      faceClassName={cn(
        "px-4 py-3",
        status === "paid" &&
          "bg-[color-mix(in_srgb,var(--color-success)_10%,var(--color-surface))]",
        status === "pending" &&
          "bg-[color-mix(in_srgb,var(--color-gold)_12%,var(--color-surface))]",
        status === "failed" &&
          "bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))]",
      )}
    >
      <p
        className={cn(
          "font-pixel text-[10px] uppercase",
          status === "paid" && "text-success",
          status === "pending" && "text-gold",
          status === "failed" && "text-danger",
        )}
      >
        Payout · {copy.label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{copy.body}</p>
    </PixelCard>
  );
}
