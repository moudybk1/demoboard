"use client";

import { useEffect } from "react";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Confirm leaving a live match. Sit fee is not refunded.
 */
export function LeaveMatchModal({
  open,
  busy,
  onStay,
  onLeave,
}: {
  open: boolean;
  busy?: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onStay();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, open, onStay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Stay in the match"
        className="absolute inset-0 bg-void/80 backdrop-blur-[2px]"
        disabled={busy}
        onClick={onStay}
      />

      <PixelCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-match-title"
        size="lg"
        stroke="danger"
        className="relative z-10 w-full max-w-md"
        faceClassName="px-5 py-5 sm:px-6 sm:py-6"
      >
        <p className="font-pixel text-[10px] font-semibold uppercase tracking-wide text-danger">
          Match in play
        </p>
        <h2
          id="leave-match-title"
          className="mt-2 font-pixel text-xl font-bold uppercase leading-snug text-parchment"
        >
          Leave the match?
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
          If you leave, you will lose and your entry fee isn&apos;t refunded.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <PixelButton
            type="button"
            size="md"
            variant="primary"
            className="w-full justify-center border-danger bg-danger text-cream hover:bg-[#ff5a5a] sm:w-auto"
            disabled={busy}
            onClick={onLeave}
          >
            {busy ? "Leaving…" : "Leave anyway"}
          </PixelButton>
          <PixelButton
            type="button"
            size="md"
            variant="outline"
            className="w-full justify-center sm:w-auto"
            disabled={busy}
            onClick={onStay}
          >
            Stay
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
}
