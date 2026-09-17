"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { pawnPoint } from "@/lib/game/board-geometry";
import { BOARD_SIZE } from "@/lib/game/monopoly-board";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { playHopSound } from "@/lib/game/sfx";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { seatColor } from "@/lib/game/seats";

export type PawnState = {
  id: string;
  seat: number;
  username: string;
  tile: number;
  eliminated: boolean;
};

/** Seconds spent hopping over a single tile. */
export const PAWN_STEP_DURATION = 0.24;

/**
 * Pawns on the Monopoly board. Pass `movingSeat` + `movePath` (tile indices)
 * to hop a piece cell-by-cell; static seats stay parked on `pawn.tile`.
 *
 * Position is owned by GSAP only. Never put left/top/transform in React
 * style, or every re-render fights the hop timeline.
 */
export function PawnLayer({
  pawns,
  movingSeat = null,
  movePath = null,
  onMoveComplete,
}: {
  pawns: PawnState[];
  movingSeat?: number | null;
  movePath?: number[] | null;
  onMoveComplete?: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {pawns.map((pawn) => (
        <Pawn
          key={pawn.id}
          pawn={pawn}
          moving={movingSeat === pawn.seat}
          movePath={movingSeat === pawn.seat ? movePath : null}
          onMoveComplete={onMoveComplete}
        />
      ))}
    </div>
  );
}

function Pawn({
  pawn,
  moving,
  movePath,
  onMoveComplete,
}: {
  pawn: PawnState;
  moving: boolean;
  movePath: number[] | null;
  onMoveComplete?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);
  // Latest callback, read by the GSAP timeline without re-running it. Written
  // in an effect: assigning a ref during render is not safe under concurrent
  // rendering, where a render can be discarded.
  const completeRef = useRef(onMoveComplete);
  useEffect(() => {
    completeRef.current = onMoveComplete;
  }, [onMoveComplete]);

  const color = seatColor(pawn.seat);
  const parked = pawnPoint(pawn.tile, pawn.seat);

  // Park + place (GSAP owns left/top). Skip while this seat is hopping.
  useEffect(() => {
    const node = ref.current;
    if (!node || moving) return;

    gsap.killTweensOf(node);
    gsap.set(node, {
      xPercent: -50,
      yPercent: -50,
      left: `${parked.x}%`,
      top: `${parked.y}%`,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: pawn.eliminated ? 0.35 : 1,
    });

    if (introDone.current || prefersReducedMotion()) {
      introDone.current = true;
      return;
    }

    introDone.current = true;
    gsap.fromTo(
      node,
      { opacity: 0, y: -28, scale: 0.55 },
      {
        opacity: pawn.eliminated ? 0.35 : 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        delay: pawn.seat * 0.06,
        ease: "back.out(1.8)",
        overwrite: "auto",
      },
    );
  }, [moving, parked.x, parked.y, pawn.eliminated, pawn.seat]);

  // Hop along an explicit path from the room controller.
  useEffect(() => {
    const node = ref.current;
    if (!node || !moving || !movePath || movePath.length === 0) return;

    const finish = () => {
      completeRef.current?.();
    };

    if (prefersReducedMotion()) {
      const endTile = movePath[movePath.length - 1];
      const end = pawnPoint(endTile, pawn.seat);
      gsap.set(node, {
        xPercent: -50,
        yPercent: -50,
        left: `${end.x}%`,
        top: `${end.y}%`,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      });
      finish();
      return;
    }

    gsap.killTweensOf(node);
    gsap.set(node, {
      xPercent: -50,
      yPercent: -50,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
    });

    let completed = false;
    const timeline = gsap.timeline({
      onComplete: () => {
        completed = true;
        finish();
      },
    });

    for (const tile of movePath) {
      const point = pawnPoint(tile, pawn.seat);
      timeline
        .to(node, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: PAWN_STEP_DURATION,
          ease: "none",
        })
        .to(
          node,
          {
            scaleX: 1.2,
            scaleY: 1.35,
            y: -7,
            duration: PAWN_STEP_DURATION / 2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onStart: () => playHopSound(),
          },
          `-=${PAWN_STEP_DURATION}`,
        );
    }

    timeline.to(node, {
      scaleX: 1,
      scaleY: 1,
      y: 0,
      duration: 0.12,
      ease: "back.out(2.5)",
    });

    return () => {
      timeline.kill();
      if (!completed) {
        // Strict Mode: snap back to current parked tile; remount restarts hop.
        const start = pawnPoint(pawn.tile, pawn.seat);
        gsap.set(node, {
          left: `${start.x}%`,
          top: `${start.y}%`,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
        });
      }
    };
  }, [moving, movePath, pawn.seat, pawn.tile]);

  return (
    <div
      ref={ref}
      className="absolute z-30 will-change-transform"
      style={{
        // ~55% of one board cell so the piece sits cleanly inside the tile.
        width: `${(100 / BOARD_SIZE) * 0.55}%`,
        minWidth: 14,
      }}
      aria-label={`${pawn.username} (${color.label})`}
    >
      <div
        className="drop-shadow-[0_2px_0_rgba(7,9,15,0.95)]"
        style={{ filter: pawn.eliminated ? "grayscale(1)" : undefined }}
      >
        <PixelArt
          sprite={pawnSprite(pawn.seat)}
          label={`${pawn.username} (${color.label})`}
        />
      </div>
    </div>
  );
}
