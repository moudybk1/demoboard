"use client";

import { useEffect } from "react";

import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Centered notice used while wallet connect is not live yet.
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close coming soon"
        className="absolute inset-0 bg-void/80"
        onClick={onClose}
      />

      <PixelCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        size="lg"
        className="relative z-10 w-full max-w-sm"
        faceClassName="px-6 py-8 text-center sm:px-8 sm:py-10"
      >
        <p className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep">
          Wallet
        </p>
        <h2
          id="coming-soon-title"
          className="mt-3 font-pixel text-3xl font-bold leading-none text-parchment sm:text-4xl"
        >
          Coming Soon
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Wallet connect is not live yet. Tables stay on the closed demo for
          now.
        </p>
        <PixelButton
          type="button"
          variant="primary"
          size="md"
          className="mt-6 w-full justify-center"
          onClick={onClose}
        >
          Got it
        </PixelButton>
      </PixelCard>
    </div>
  );
}
