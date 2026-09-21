"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { cellCenter, type LudoPawnView } from "@/lib/game/ludo-geometry";
import { pawnGlyph, pawnSprite } from "@/lib/game/pawn-sprite";
import { playHopSound } from "@/lib/game/sfx";
import { seatColor } from "@/lib/game/seats";
import { cn } from "@/lib/utils";

const STEP_MS = 0.14;

/**
 * Living Ludo pawns. Selectable pawns light up after a roll; choosing one
 * hops them along `movePath` cell by cell.
 */
export function LudoPawnLayer({
  pawns,
  selectableIds,
  movingId,
  movePath,
  onSelect,
  onMoveComplete,
}: {
  pawns: LudoPawnView[];
  selectableIds: string[];
  movingId: string | null;
  movePath: [number, number][] | null;
  onSelect: (pawnId: string) => void;
  onMoveComplete: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10">
      {pawns.map((pawn) => (
        <LudoPawnToken
          key={pawn.id}
          pawn={pawn}
          selectable={selectableIds.includes(pawn.id)}
          moving={movingId === pawn.id}
          movePath={movingId === pawn.id ? movePath : null}
          onSelect={() => onSelect(pawn.id)}
          onMoveComplete={onMoveComplete}
        />
      ))}
    </div>
  );
}

function LudoPawnToken({
  pawn,
  selectable,
  moving,
  movePath,
  onSelect,
  onMoveComplete,
}: {
  pawn: LudoPawnView;
  selectable: boolean;
  moving: boolean;
  movePath: [number, number][] | null;
  onSelect: () => void;
  onMoveComplete: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = seatColor(pawn.seat);
  const finished = pawn.status === "finished";
  const inYard = pawn.status === "yard";

  // Place + idle bob.
  useEffect(() => {
    const node = ref.current;
    if (!node || moving) return;

    gsap.set(node, {
      xPercent: -50,
      yPercent: -50,
      left: `${pawn.point.x}%`,
      top: `${pawn.point.y}%`,
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) return;

    const idle = gsap.to(node, {
      y: selectable ? -6 : inYard ? -2 : -4,
      duration: selectable ? 0.55 : inYard ? 1.4 : 0.9,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      // Idle bob yields when a hop timeline starts (overwrite: auto).
    });

    const pulse = selectable
      ? gsap.to(node, {
          scale: 1.2,
          duration: 0.45,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        })
      : null;

    return () => {
      idle.kill();
      pulse?.kill();
    };
  }, [
    pawn.point.x,
    pawn.point.y,
    selectable,
    inYard,
    moving,
  ]);

  // Hop along the move path.
  useEffect(() => {
    const node = ref.current;
    if (!node || !moving || !movePath) return;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onMoveComplete();
    };

    if (movePath.length === 0) {
      finish();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (reduced) {
      const end = cellCenter(
        movePath[movePath.length - 1][0],
        movePath[movePath.length - 1][1],
      );
      gsap.set(node, { left: `${end.x}%`, top: `${end.y}%`, y: 0, scale: 1 });
      finish();
      return;
    }

    const timeline = gsap.timeline({
      onComplete: finish,
    });

    for (const [row, col] of movePath) {
      const point = cellCenter(row, col);
      timeline
        .to(node, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: STEP_MS,
          ease: "none",
        })
        .to(
          node,
          {
            scaleX: 1.2,
            scaleY: 1.35,
            y: -5,
            duration: STEP_MS / 2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onStart: () => playHopSound(),
          },
          `-=${STEP_MS}`,
        );
    }

    timeline.to(node, { scale: 1, duration: 0.12, ease: "back.out(3)" });

    return () => {
      timeline.kill();
    };
  }, [moving, movePath, onMoveComplete]);

  return (
    <button
      type="button"
      ref={ref}
      disabled={!selectable}
      onClick={onSelect}
      className={cn(
        "absolute w-[4.6%] will-change-transform",
        selectable
          ? "pointer-events-auto cursor-pointer"
          : "pointer-events-none",
        selectable && "drop-shadow-[0_0_6px_var(--color-gold)]",
      )}
      style={{ opacity: finished ? 0.85 : 1 }}
      aria-label={`${pawn.username} pawn ${pawn.pawnIndex + 1}${
        selectable ? " · tap to move" : ""
      }`}
    >
      <div className="relative drop-shadow-[0_2px_0_rgba(7,9,15,0.9)]">
        <PixelArt
          sprite={pawnSprite(pawn.seat)}
          label={`${pawn.username} ${color.label} ${pawnGlyph(pawn.seat)} pawn ${pawn.pawnIndex + 1}`}
        />
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid size-[45%] place-items-center border border-void bg-ink font-pixel text-[clamp(4px,0.55vh,7px)] leading-none",
            color.text,
          )}
        >
          {pawn.pawnIndex + 1}
        </span>
      </div>
    </button>
  );
}
