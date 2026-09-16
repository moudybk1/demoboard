import type { WinPayoutStatus } from "@/lib/mock/wins";
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
    <div
      role="status"
      className={cn(
        "pixel-corners border-2 px-4 py-3",
        status === "paid" && "border-success/40 bg-success/5",
        status === "pending" && "border-gold/40 bg-gold/5",
        status === "failed" && "border-danger/40 bg-danger/5",
        className,
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
    </div>
  );
}
