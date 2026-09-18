"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Centered notice used while wallet connect is not live yet.
 * Portaled to body so hero transforms / overflow never trap the dialog.
 */
export function ComingSoonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-void/80"
        onClick={onClose}
      />

      <PixelCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        aria-describedby="coming-soon-body"
        size="lg"
        className="relative z-10 w-full max-w-md"
        faceClassName="px-6 py-8 text-center sm:px-8 sm:py-10"
      >
        <p className="font-pixel text-xs font-semibold uppercase leading-none tracking-[0.14em] text-gold-deep">
          Work in progress
        </p>
        <h2
          id="coming-soon-title"
          className="mt-3 font-pixel text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight text-parchment"
        >
          Coming soon
        </h2>
        <p
          id="coming-soon-body"
          className="mx-auto mt-4 max-w-[34ch] text-base leading-relaxed text-muted"
        >
          Wallet connect is almost ready. We&apos;re putting the finishing
          touches on so you can jump in and play for real. Hang tight —
          we&apos;re really close.
        </p>
        <PixelButton
          type="button"
          variant="primary"
          size="md"
          className="mt-7 w-full justify-center"
          onClick={onClose}
        >
          Got it
        </PixelButton>
      </PixelCard>
    </div>,
    document.body,
  );
}
