"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelPanel } from "@/components/ui/pixel-panel";
import { seatColor } from "@/lib/game/seats";
import { cn } from "@/lib/utils";

export type RentNotice = {
  /** Changes on every rent event so the toast replays its animation. */
  id: string;
  country: string;
  amount: number;
  payerSeat: number;
  payerName: string;
  ownerSeat: number;
  ownerName: string;
  /** True when the rent emptied the payer's cash. */
  bankrupted: boolean;
  youArePayer: boolean;
};

const VISIBLE_MS = 3200;

/**
 * Slides in over the board when rent changes hands. Framed in the payer's
 * colour so it's obvious at a glance who just got hit.
 */
export function RentToast({
  notice,
  onDismiss,
}: {
  notice: RentNotice;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const payer = seatColor(notice.payerSeat);
  const owner = seatColor(notice.ownerSeat);

  useEffect(() => {
    const node = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (node && !reduced) {
      gsap.fromTo(
        node,
        { y: -28, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
      );
    }

    const timer = window.setTimeout(onDismiss, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [notice.id, onDismiss]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[14%] z-20 flex justify-center px-4">
      <div ref={ref}>
        <PixelPanel
          role="status"
          aria-live="polite"
          tone="raised"
          className={cn("border-2 px-4 py-3 text-center", payer.border)}
        >
          <p className="font-pixel text-xs uppercase text-faint">
            {notice.bankrupted ? "Bankrupt" : "Rent paid"}
          </p>

          <p className="mt-2 text-xs text-parchment">
            <span className={payer.text}>{notice.payerName}</span> paid{" "}
            <BoardAmount
              value={notice.amount}
              size="xs"
              tone="gold"
              showTicker={false}
            />{" "}
            to <span className={owner.text}>{notice.ownerName}</span>
          </p>

          <p className="mt-1 text-[11px] text-muted">for {notice.country}</p>

          {notice.bankrupted && (
            <p className="mt-2 font-pixel text-xs uppercase text-danger">
              {notice.youArePayer
                ? "You are out of the game"
                : `${notice.payerName} is out`}
            </p>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
