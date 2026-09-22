"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { ludoSeatColor } from "@/lib/game/ludo-board";
import { cellCenter, type LudoPawnView } from "@/lib/game/ludo-geometry";
import { ludoPawnSprite, pawnGlyph } from "@/lib/game/pawn-sprite";
import { playHopSound } from "@/lib/game/sfx";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { cn } from "@/lib/utils";

const STEP_MS = 0.14;
const RETURN_MS = 0.07;

/**
 * Living Ludo pawns. Selectable pawns light up after a roll; choosing one
 * hops them along `movePath` cell by cell.
 */
export function LudoPawnLayer({
  pawns,
  selectableIds,
  movingId,
  movePath,
  returnPaths,
  onSelect,
  onMoveComplete,
  onReturnComplete,
}: {
  pawns: LudoPawnView[];
  selectableIds: string[];
  movingId: string | null;
  movePath: [number, number][] | null;
  returnPaths: Record<string, [number, number][]>;
  onSelect: (pawnId: string) => void;
  onMoveComplete: () => void;
  onReturnComplete: (pawnId: string) => void;
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
          returnPath={returnPaths[pawn.id] ?? null}
          onSelect={() => onSelect(pawn.id)}
          onMoveComplete={onMoveComplete}
          onReturnComplete={() => onReturnComplete(pawn.id)}
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
  returnPath,
  onSelect,
  onMoveComplete,
  onReturnComplete,
}: {
  pawn: LudoPawnView;
  selectable: boolean;
  moving: boolean;
  movePath: [number, number][] | null;
  returnPath: [number, number][] | null;
  onSelect: () => void;
  onMoveComplete: () => void;
  onReturnComplete: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = ludoSeatColor(pawn.seat);
  const finished = pawn.status === "finished";
  const returning = returnPath != null && returnPath.length > 0;
  // Latest callbacks, read by the timelines. A fresh function each render must
  // not restart a hop or a capture walk.
  const onMoveCompleteRef = useRef(onMoveComplete);
  const onReturnCompleteRef = useRef(onReturnComplete);
  useEffect(() => {
    onMoveCompleteRef.current = onMoveComplete;
  }, [onMoveComplete]);
  useEffect(() => {
    onReturnCompleteRef.current = onReturnComplete;
  }, [onReturnComplete]);
  const moveKey = movePath?.map((cell) => cell.join(",")).join("|") ?? "";
  const returnKey = returnPath?.map((cell) => cell.join(",")).join("|") ?? "";

  // Place + idle bob.
  useEffect(() => {
    const node = ref.current;
    if (!node || moving || returning) return;

    gsap.set(node, {
      xPercent: -50,
      yPercent: -50,
      left: `${pawn.point.x}%`,
      top: `${pawn.point.y}%`,
    });

    const reduced = prefersReducedMotion();
    if (reduced) return;

    // Only animate selectable pawns. Idle-bobbing all 16 pieces burns frames.
    if (!selectable) return;

    const idle = gsap.to(node, {
      y: -6,
      duration: 0.55,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    const pulse = gsap.to(node, {
      scale: 1.18,
      duration: 0.45,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    return () => {
      idle.kill();
      pulse.kill();
    };
  }, [pawn.point.x, pawn.point.y, selectable, moving, returning]);

  // Hop along the move path.
  useEffect(() => {
    const node = ref.current;
    if (!node || !moving || !movePath) return;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onMoveCompleteRef.current();
    };

    if (movePath.length === 0) {
      finish();
      return;
    }

    const reduced = prefersReducedMotion();

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
    // moveKey is the cell list. A new array with the same cells must not replay the hop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving, moveKey]);

  // Walk a captured pawn back along the track into its yard.
  useEffect(() => {
    const node = ref.current;
    if (!node || !returnPath || returnPath.length === 0) return;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onReturnCompleteRef.current();
    };

    const end = cellCenter(
      returnPath[returnPath.length - 1][0],
      returnPath[returnPath.length - 1][1],
    );

    if (prefersReducedMotion()) {
      gsap.set(node, {
        xPercent: -50,
        yPercent: -50,
        left: `${end.x}%`,
        top: `${end.y}%`,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
      });
      finish();
      return;
    }

    const stepMs =
      returnPath.length > 16
        ? Math.max(0.036, Math.min(RETURN_MS, 1.4 / returnPath.length))
        : RETURN_MS;
    const soundEvery = stepMs < 0.05 ? 4 : 2;

    gsap.killTweensOf(node);
    gsap.set(node, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
    });

    const timeline = gsap.timeline({ onComplete: finish });

    returnPath.forEach(([row, col], index) => {
      const point = cellCenter(row, col);
      timeline
        .to(node, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: stepMs,
          ease: "none",
        })
        .to(
          node,
          {
            scaleX: 1.12,
            scaleY: 1.28,
            y: -4,
            duration: stepMs / 2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onStart: () => {
              if (index % soundEvery === 0) playHopSound();
            },
          },
          `-=${stepMs}`,
        );
    });

    timeline.to(node, {
      scaleX: 1,
      scaleY: 1,
      y: 0,
      duration: 0.1,
      ease: "back.out(3)",
    });

    return () => {
      timeline.kill();
    };
    // returnKey is the cell list. Parent re-renders must not replay the walk home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnKey]);

  return (
    <button
      type="button"
      ref={ref}
      disabled={!selectable}
      onClick={onSelect}
      className={cn(
        "absolute w-[4.6%]",
        (moving || returning) && "z-30 will-change-transform",
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
          sprite={ludoPawnSprite(pawn.seat)}
          label={`${pawn.username} ${color.label} ${pawnGlyph(pawn.seat)} pawn ${pawn.pawnIndex + 1}`}
        />
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 grid size-[45%] place-items-center border border-void bg-ink font-pixel text-[clamp(4px,0.55vh,7px)] leading-none"
          style={{ color: color.hex }}
        >
          {pawn.pawnIndex + 1}
        </span>
      </div>
    </button>
  );
}
