"use client";

import { useCallback, useEffect, useState } from "react";

import { JailPixel } from "@/components/game/jail-pixel";
import { PixelArt } from "@/components/game/pixel-art";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { cn } from "@/lib/utils";

const PARADE = [
  { seat: 1, delay: "0s" },
  { seat: 2, delay: "4.5s" },
  { seat: 3, delay: "9s" },
  { seat: 4, delay: "13.5s" },
] as const;

/**
 * Footer strip: pawns walk above the flat rule into jail. Click a pawn to jump.
 */
export function FooterParade({ className }: { className?: string }) {
  const [jumping, setJumping] = useState<Record<number, boolean>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduceMotion(
        media.matches ||
          document.documentElement.dataset.reducedMotion === "true",
      );
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const onJump = useCallback((seat: number) => {
    setJumping((prev) => ({ ...prev, [seat]: true }));
  }, []);

  const onJumpEnd = useCallback((seat: number) => {
    setJumping((prev) => ({ ...prev, [seat]: false }));
  }, []);

  if (reduceMotion) {
    return (
      <div className={cn("footer-parade", className)} aria-hidden>
        <div className="footer-parade-jail">
          <JailPixel />
          <span className="footer-parade-jail-label">JAIL</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("footer-parade", className)}
      aria-label="Pawns walking to jail. Click a pawn to make it jump."
    >
      <div className="footer-parade-jail">
        <JailPixel />
        <span className="footer-parade-jail-label">JAIL</span>
      </div>
      {PARADE.map((pawn) => (
        <button
          key={pawn.seat}
          type="button"
          className="footer-parade-pawn"
          style={{ animationDelay: pawn.delay }}
          aria-label={`Pawn ${pawn.seat}. Click to jump.`}
          onClick={() => onJump(pawn.seat)}
        >
          <span
            className={cn(
              "footer-parade-pawn-body",
              jumping[pawn.seat] && "is-jumping",
            )}
            onAnimationEnd={(event) => {
              if (event.animationName.includes("footer-pawn-click-jump")) {
                onJumpEnd(pawn.seat);
              }
            }}
          >
            <PixelArt sprite={pawnSprite(pawn.seat)} />
          </span>
        </button>
      ))}
    </div>
  );
}
