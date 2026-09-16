"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { seatColor } from "@/lib/game/seats";
import { cn } from "@/lib/utils";

export type CaptureEvent = {
  id: string;
  /** Board percentage where the capture happened. */
  x: number;
  y: number;
  /** Seat of the pawn that got sent home. */
  victimSeat: number;
};

/**
 * Burst of seat-coloured shards when a pawn is eaten. Plays once per event
 * id, then calls `onDone` so the parent can clear it.
 */
export function CaptureBurst({
  event,
  onDone,
}: {
  event: CaptureEvent;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const color = seatColor(event.victimSeat);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const shards = node.querySelectorAll<HTMLElement>("[data-shard]");
    const label = node.querySelector<HTMLElement>("[data-label]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (reduced) {
      onDone();
      return;
    }

    const timeline = gsap.timeline({ onComplete: onDone });
    timeline.fromTo(
      node,
      { scale: 0.3, opacity: 0 },
      { scale: 1.15, opacity: 1, duration: 0.14, ease: "power2.out" },
    );
    timeline.to(node, { scale: 1, duration: 0.08, ease: "power1.in" });
    if (label) {
      timeline.fromTo(
        label,
        { y: 6, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.18, ease: "back.out(2)" },
        0.05,
      );
    }
    timeline.to(
      shards,
      {
        x: (index) => Math.cos((index / shards.length) * Math.PI * 2) * 36,
        y: (index) => Math.sin((index / shards.length) * Math.PI * 2) * 36,
        opacity: 0,
        scale: 0.15,
        rotate: (index) => (index % 2 === 0 ? 90 : -90),
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.015,
      },
      0.05,
    );
    timeline.to(node, { opacity: 0, duration: 0.18 }, "-=0.08");

    return () => {
      timeline.kill();
    };
  }, [event.id, onDone]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-20"
      style={{
        left: `${event.x}%`,
        top: `${event.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      role="img"
      aria-label="Pawn captured"
    >
      <span
        data-label
        className="absolute left-1/2 top-[-1.4rem] -translate-x-1/2 font-pixel text-xs uppercase text-gold text-shadow-pixel"
      >
        Captured!
      </span>
      <span
        className={cn(
          "absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 border-2 border-void",
          color.bg,
        )}
      />
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          data-shard
          className={cn(
            "absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 border border-void/50",
            color.bg,
          )}
        />
      ))}
    </div>
  );
}
