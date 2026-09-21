"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import {
  finishDiceRoll,
  startDiceRoll,
  stopDiceRollLoop,
} from "@/lib/audio/audio-manager";
import { PIP_LAYOUT, randomDie, type DieValue } from "@/lib/game/dice";
import { cn } from "@/lib/utils";

/** How often the faces change while the dice are tumbling. */
const FLICKER_MS = 120;

const TUMBLE_UP = 0.26;
const TUMBLE_DOWN = 0.26;
const TUMBLE_UP_2 = 0.22;
const TUMBLE_DOWN_2 = 0.22;
const LAND_DURATION = 0.55;

/**
 * Tie the table-clatter SFX to the rolling flag. Starts when the tumble
 * begins, lands when it ends, and cancels quietly on unmount.
 */
function useDiceRollSound(rolling: boolean) {
  const wasRolling = useRef(false);

  useEffect(() => {
    if (rolling) {
      startDiceRoll();
      wasRolling.current = true;
      return () => {
        stopDiceRollLoop();
      };
    }

    if (wasRolling.current) {
      wasRolling.current = false;
      finishDiceRoll();
    }
  }, [rolling]);
}

/**
 * The pair of dice. While `rolling` is true the faces flicker and the dice
 * bounce; when a result arrives they snap to it with a landing bounce.
 */
export function DiceTray({
  values,
  rolling,
  className,
}: {
  values: readonly [DieValue, DieValue] | null;
  rolling: boolean;
  className?: string;
}) {
  const [flicker, setFlicker] = useState<readonly [DieValue, DieValue]>([1, 1]);
  useDiceRollSound(rolling);

  // Cycle random faces for as long as the roll is in flight.
  useEffect(() => {
    if (!rolling) return;

    const timer = window.setInterval(() => {
      setFlicker([randomDie(), randomDie()]);
    }, FLICKER_MS);

    return () => window.clearInterval(timer);
  }, [rolling]);

  // Derived rather than synced: the result wins once the tumble stops, and the
  // last flickered pair stands in before the first roll of the turn.
  const faces = rolling ? flicker : (values ?? flicker);
  const total = rolling || !values ? null : values[0] + values[1];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex gap-2">
        <Die face={faces[0]} rolling={rolling} delay={0} />
        <Die face={faces[1]} rolling={rolling} delay={0.06} />
      </div>

      <div aria-live="polite" className="min-w-14">
        {total !== null && (
          <>
            <p className="font-pixel text-xs font-semibold uppercase text-faint">Rolled</p>
            <p className="font-pixel text-lg text-gold-deep">
              {total}
            </p>
          </>
        )}
        {rolling && (
          <p className="font-pixel text-xs font-semibold uppercase text-muted animate-pulse-glow">
            Rolling…
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Single die for Ludo. Same tumble/land animation as the Monopoly pair.
 */
export function DieTray({
  value,
  rolling,
  className,
}: {
  value: DieValue | null;
  rolling: boolean;
  className?: string;
}) {
  const [flicker, setFlicker] = useState<DieValue>(1);
  useDiceRollSound(rolling);

  useEffect(() => {
    if (!rolling) return;

    const timer = window.setInterval(() => {
      setFlicker(randomDie());
    }, FLICKER_MS);

    return () => window.clearInterval(timer);
  }, [rolling]);

  const face = rolling ? flicker : (value ?? flicker);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Die face={face} rolling={rolling} delay={0} />

      <div aria-live="polite" className="min-w-14">
        {!rolling && value !== null && (
          <>
            <p className="font-pixel text-xs font-semibold uppercase text-faint">Rolled</p>
            <p className="font-pixel text-lg text-ludo">
              {value}
            </p>
          </>
        )}
        {rolling && (
          <p className="font-pixel text-xs font-semibold uppercase text-muted animate-pulse-glow">
            Rolling…
          </p>
        )}
      </div>
    </div>
  );
}

function Die({
  face,
  rolling,
  delay,
}: {
  face: DieValue;
  rolling: boolean;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pips = PIP_LAYOUT[face];

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!rolling) return;

    const timeline = gsap.timeline({ repeat: -1, delay });
    timeline
      .to(node, {
        y: -16,
        rotate: 90,
        scale: 1.08,
        duration: TUMBLE_UP,
        ease: "power2.out",
      })
      .to(node, {
        y: 0,
        rotate: 180,
        scale: 0.92,
        duration: TUMBLE_DOWN,
        ease: "power2.in",
      })
      .to(node, {
        y: -11,
        rotate: 270,
        scale: 1.06,
        duration: TUMBLE_UP_2,
        ease: "power2.out",
      })
      .to(node, {
        y: 0,
        rotate: 360,
        scale: 1,
        duration: TUMBLE_DOWN_2,
        ease: "power2.in",
      })
      .set(node, { rotate: 0 });

    return () => {
      timeline.kill();
    };
  }, [rolling, delay]);

  useEffect(() => {
    const node = ref.current;
    if (!node || rolling) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const landing = gsap.fromTo(
      node,
      { y: -18, scale: 1.28, rotate: -8 },
      {
        y: 0,
        scale: 1,
        rotate: 0,
        duration: LAND_DURATION,
        ease: "bounce.out",
        delay,
      },
    );

    return () => {
      landing.kill();
    };
  }, [rolling, delay, face]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Die showing ${face}`}
      className="grid size-11 shrink-0 grid-cols-3 grid-rows-3 gap-[3px] pixel-corners border-[3px] border-void bg-cream p-[5px] shadow-pixel-sm"
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span
          key={cell}
          className={cn(
              pips.includes(cell) ? "bg-void pixel-corners" : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
