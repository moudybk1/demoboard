"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { LudoBoard } from "@/components/room/ludo-board";
import type { DieValue } from "@/lib/game/dice";
import { cellCenter, pawnPoint } from "@/lib/game/ludo-geometry";
import {
  findCaptures,
  previewMove,
  sendHome,
  type MovePreview,
} from "@/lib/game/ludo-rules";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import type { LudoPawn, LudoRoomState } from "@/lib/mock/ludo";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { playWhileVisible } from "@/lib/motion/play-while-visible";
import { cn } from "@/lib/utils";

const DIE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;

/**
 * Flat 2D Monopoly board — turn loop with smooth pawn travel.
 */
export function MonopolyDemo({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const pawns = Array.from(
      node.querySelectorAll<HTMLElement>("[data-mnp-pawn]"),
    );
    const die = node.querySelector<HTMLElement>("[data-mnp-die]");
    const cells = Array.from(
      node.querySelectorAll<HTMLElement>("[data-mnp-cell]"),
    );
    const banner = node.querySelector<HTMLElement>("[data-mnp-banner]");
    const positions = perimeterPoints(40);
    const seatIndex = [0, 10, 20, 30];

    pawns.forEach((pawn, seat) => {
      const point = positions[seatIndex[seat]];
      gsap.set(pawn, {
        left: `${point.x}%`,
        top: `${point.y}%`,
        xPercent: -50,
        yPercent: -50,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        force3D: true,
      });
    });

    let cancelled = false;
    const master = gsap.timeline({ repeat: -1, repeatDelay: 0.45 });

    const clearCellGlow = () => {
      cells.forEach((cell) => {
        gsap.set(cell, { backgroundColor: "rgba(26,33,30,1)" });
      });
    };

    master.add(() => {
      seatIndex[0] = 0;
      seatIndex[1] = 10;
      seatIndex[2] = 20;
      seatIndex[3] = 30;
      pawns.forEach((pawn, seat) => {
        const point = positions[seatIndex[seat]];
        gsap.set(pawn, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
        });
      });
      clearCellGlow();
      if (banner) banner.textContent = "MONOPOLY";
    });

    const rollDie = (value: number) => {
      if (!die) return;
      master.to(die, {
        keyframes: [
          { x: -4, rotation: -14, duration: 0.06 },
          { x: 5, rotation: 12, duration: 0.06 },
          { x: -5, rotation: -16, duration: 0.06 },
          { x: 4, rotation: 10, duration: 0.06 },
          { x: 0, rotation: 0, duration: 0.08 },
        ],
        ease: "power1.inOut",
        onUpdate: () => {
          die.textContent = DIE_FACES[Math.floor(Math.random() * 6)];
        },
      });
      master.add(() => {
        die.textContent = DIE_FACES[value - 1];
      });
      master.to(die, {
        scale: 1.18,
        duration: 0.16,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    };

    const movePawn = (pawn: HTMLElement, from: number, steps: number) => {
      for (let s = 1; s <= steps; s += 1) {
        const idx = (from + s) % positions.length;
        const next = positions[idx];
        const cell = cells[idx];

        master.add(() => {
          if (cell) {
            gsap.to(cell, {
              backgroundColor: "rgba(62,201,176,0.55)",
              duration: 0.12,
              ease: "power1.out",
            });
          }
        });

        // Smooth glide between tiles + soft hop arc
        master.to(pawn, {
          left: `${next.x}%`,
          top: `${next.y}%`,
          duration: 0.28,
          ease: "power2.inOut",
        });
        master.to(
          pawn,
          {
            y: -10,
            scaleY: 1.08,
            scaleX: 0.94,
            duration: 0.14,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          },
          "<",
        );

        if (cell) {
          master.to(
            cell,
            {
              backgroundColor: "rgba(26,33,30,1)",
              duration: 0.2,
              ease: "power1.in",
            },
            ">-0.08",
          );
        }
      }
    };

    for (let seat = 0; seat < 4; seat += 1) {
      const pawn = pawns[seat];
      if (!pawn) continue;

      const roll = 2 + ((seat * 3 + 1) % 5);

      master.add(() => {
        if (cancelled) return;
        clearCellGlow();
        pawns.forEach((p, i) => {
          gsap.to(p, {
            opacity: i === seat ? 1 : 0.4,
            duration: 0.25,
            ease: "power2.out",
          });
        });
        if (banner) {
          banner.textContent = `P${seat + 1} · ${roll}`;
          gsap.fromTo(
            banner,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" },
          );
        }
      });

      rollDie(roll);
      movePawn(pawn, seatIndex[seat], roll);
      seatIndex[seat] = (seatIndex[seat] + roll) % positions.length;
      master.to({}, { duration: 0.3 });
    }

    master.add(() => {
      pawns.forEach((p) => {
        gsap.to(p, { opacity: 1, duration: 0.25, ease: "power2.out" });
      });
      if (banner) banner.textContent = "MONOPOLY";
      clearCellGlow();
    });

    const stopVisibilityGate = playWhileVisible(node, () => [master]);

    return () => {
      stopVisibilityGate();
      cancelled = true;
      master.kill();
      clearCellGlow();
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn(
        "relative aspect-square w-full overflow-hidden border-2 border-monopoly/60 bg-ink shadow-pixel-lg",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-[17%] border-2 border-monopoly/40 bg-surface" />
      <p
        data-mnp-banner
        className="absolute inset-0 z-[1] flex items-center justify-center font-pixel text-[clamp(8px,1.7vw,13px)] text-monopoly text-shadow-pixel"
      >
        MONOPOLY
      </p>

      {perimeterPoints(40).map((point, index) => (
        <span
          key={index}
          data-mnp-cell
          className="absolute size-[5.5%] border border-monopoly/40 bg-surface-raised"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {[1, 2, 3, 4].map((seat) => (
        <div
          key={seat}
          data-mnp-pawn
          className="absolute z-10 w-[10%] will-change-transform drop-shadow-[2px_2px_0_rgba(0,0,0,0.7)]"
        >
          <PixelArt sprite={pawnSprite(seat)} />
        </div>
      ))}

      <div
        data-mnp-die
        className="absolute bottom-[18%] left-1/2 z-20 -translate-x-1/2 border-2 border-edge-bright bg-surface px-2 py-1 font-pixel text-xs font-semibold text-parchment shadow-pixel-sm will-change-transform"
      >
        ⚄
      </div>
    </div>
  );
}

/**
 * Flat 2D Ludo board demo — real geometry + classic rules:
 * need a 6 to leave the yard, hop the shared track, capture on unsafe cells,
 * exact count into home / finish.
 */
export function LudoDemo({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const die = node.querySelector<HTMLElement>("[data-lud-die]");
    const pawnEls = new Map<string, HTMLElement>();
    node.querySelectorAll<HTMLElement>("[data-lud-pawn]").forEach((el) => {
      const id = el.dataset.ludPawn;
      if (id) pawnEls.set(id, el);
    });

    let state = createDemoState();
    const bobByEl = new Map<HTMLElement, gsap.core.Tween>();
    const master = gsap.timeline({ repeat: -1, repeatDelay: 1.1 });

    const stopBob = (el: HTMLElement) => {
      bobByEl.get(el)?.kill();
      bobByEl.delete(el);
      gsap.set(el, { y: 0 });
    };

    const startBob = (el: HTMLElement) => {
      stopBob(el);
      const bob = gsap.to(el, {
        y: -3,
        duration: 1.15,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() * 0.5,
      });
      bobByEl.set(el, bob);
    };

    const placeAll = () => {
      for (const player of state.players) {
        for (const pawn of player.pawns) {
          const el = pawnEls.get(pawn.id);
          const point = pawnPoint(player.position, pawn);
          if (!el || !point) continue;
          gsap.set(el, {
            left: `${point.x}%`,
            top: `${point.y}%`,
            xPercent: -50,
            yPercent: -50,
            y: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            opacity: pawn.status === "finished" ? 0.55 : 1,
          });
          startBob(el);
        }
      }
    };

    placeAll();

    const setDie = (value: DieValue) => {
      if (!die) return;
      master.to(die, {
        keyframes: [
          { x: -3, rotation: -12, duration: 0.05 },
          { x: 4, rotation: 10, duration: 0.05 },
          { x: -4, rotation: -14, duration: 0.05 },
          { x: 3, rotation: 8, duration: 0.05 },
          { x: 0, rotation: 0, duration: 0.07 },
        ],
        ease: "power1.inOut",
        onUpdate: () => {
          die.textContent = DIE_FACES[Math.floor(Math.random() * 6)];
        },
      });
      master.add(() => {
        die.textContent = DIE_FACES[value - 1];
      });
      master.to(die, {
        scale: 1.16,
        duration: 0.14,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    };

    const hopPath = (el: HTMLElement, path: [number, number][]) => {
      for (const [row, col] of path) {
        const point = cellCenter(row, col);
        master.to(el, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: 0.15,
          ease: "power2.inOut",
        });
        master.to(
          el,
          {
            y: -7,
            scaleY: 1.08,
            scaleX: 0.94,
            duration: 0.075,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "<",
        );
      }
    };

    const attempt = (seat: number, roll: DieValue, pawnId: string) => {
      setDie(roll);
      master.to({}, { duration: 0.12 });

      const player = state.players.find((p) => p.position === seat);
      const pawn = player?.pawns.find((p) => p.id === pawnId);
      const el = pawnEls.get(pawnId);
      if (!player || !pawn || !el) return;

      // Resolve against current scripted state NOW so later beats see the result.
      const move = previewMove(state, seat, pawn, roll);
      if (!move) {
        master.add(() => stopBob(el));
        master.to(el, {
          x: 4,
          duration: 0.06,
          yoyo: true,
          repeat: 3,
          ease: "power1.inOut",
        });
        master.set(el, { x: 0 });
        master.add(() => startBob(el));
        master.to({}, { duration: 0.35 });
        return;
      }

      const staged = patchPawn(state, seat, move.pawnId, move.next);
      const captures = findCaptures(staged, seat, move.next);
      state = applyDemoMove(state, seat, move);

      master.add(() => stopBob(el));
      hopPath(el, move.path);

      if (captures.length) {
        master.add(() => {
          for (const cap of captures) {
            const victim = pawnEls.get(cap.victimPawnId);
            const victimPawn = state.players
              .find((p) => p.position === cap.victimSeat)
              ?.pawns.find((p) => p.id === cap.victimPawnId);
            if (!victim || !victimPawn) continue;
            const pad = pawnPoint(cap.victimSeat, victimPawn);
            if (!pad) continue;
            stopBob(victim);
            gsap.to(victim, {
              left: `${pad.x}%`,
              top: `${pad.y}%`,
              y: 0,
              duration: 0.45,
              ease: "power2.inOut",
              onComplete: () => startBob(victim),
            });
          }
        });
        master.to({}, { duration: 0.45 });
      } else {
        master.to({}, { duration: 0.28 });
      }

      master.add(() => startBob(el));
    };

    const jumpPawn = (seat: number, pawnId: string, next: LudoPawn) => {
      state = patchPawn(state, seat, pawnId, next);
      const point = pawnPoint(seat, next);
      master.add(() => {
        const el = pawnEls.get(pawnId);
        if (!el || !point) return;
        stopBob(el);
        gsap.set(el, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          opacity: next.status === "finished" ? 0.55 : 1,
        });
        startBob(el);
      });
    };

    // --- Scripted rules showcase ---
    master.add(() => {
      state = createDemoState();
      placeAll();
    });

    // 1. Need a 6 to leave the yard
    attempt(1, 3, "p1-0");

    // 2. Exit on 6
    attempt(1, 6, "p1-0");

    // 3. Advance on the shared track
    attempt(1, 5, "p1-0");

    // 4–5. Opponent enters and parks on a cell seat 1 will hit
    attempt(2, 6, "p2-0");
    attempt(2, 6, "p2-0");

    // 6–8. Seat 1 marches to the shared cell and captures
    attempt(1, 6, "p1-0");
    attempt(1, 5, "p1-0");
    attempt(1, 4, "p1-0"); // lands on seat 2 → capture

    // 9. Exact home finish (jump near door, then legal rolls)
    jumpPawn(1, "p1-0", { id: "p1-0", index: 0, status: "home", steps: 3 });
    master.to({}, { duration: 0.25 });
    attempt(1, 2, "p1-0"); // 3 + 2 = 5 → finished

    master.to({}, { duration: 0.9 });

    const stopVisibilityGate = playWhileVisible(node, () => [
      master,
      ...bobByEl.values(),
    ]);

    return () => {
      stopVisibilityGate();
      master.kill();
      bobByEl.forEach((tween) => tween.kill());
      bobByEl.clear();
      pawnEls.forEach((el) => gsap.killTweensOf(el));
      if (die) gsap.killTweensOf(die);
    };
  }, []);

  const pawns = ([1, 2, 3, 4] as const).flatMap((seat) =>
    [0, 1, 2, 3].map((index) => ({
      id: `p${seat}-${index}`,
      seat,
      index,
    })),
  );

  return (
    <div
      ref={root}
      className={cn("relative aspect-square w-full", className)}
      aria-hidden
    >
      <LudoBoard
        showYardBadges={false}
        className="shadow-pixel-lg"
        overlay={
          <>
            {pawns.map((pawn) => (
              <div
                key={pawn.id}
                data-lud-pawn={pawn.id}
                className="absolute z-20 w-[7.5%] will-change-transform drop-shadow-[1px_1px_0_rgba(0,0,0,0.65)]"
                style={{ left: "50%", top: "50%" }}
              >
                <PixelArt sprite={pawnSprite(pawn.seat)} />
              </div>
            ))}
            <div
              data-lud-die
              className="absolute bottom-[3%] left-1/2 z-30 -translate-x-1/2 border-2 border-edge-bright bg-ink px-2 py-1 font-pixel text-xs font-semibold text-parchment shadow-pixel-sm will-change-transform"
            >
              ⚄
            </div>
          </>
        }
      />
    </div>
  );
}

function createDemoState(): LudoRoomState {
  return {
    roomId: "demo",
    entryFee: 0,
    maxPlayers: 4,
    activeSeat: 1,
    turn: 1,
    turnSecondsLeft: 30,
    lastRoll: null,
    players: ([1, 2, 3, 4] as const).map((seat) => ({
      id: `s${seat}`,
      username: `P${seat}`,
      position: seat,
      status: "alive" as const,
      isYou: seat === 1,
      pawns: [0, 1, 2, 3].map((index) => ({
        id: `p${seat}-${index}`,
        index,
        status: "yard" as const,
        steps: 0,
      })),
    })),
    log: [],
  };
}

function patchPawn(
  state: LudoRoomState,
  seat: number,
  pawnId: string,
  next: LudoPawn,
): LudoRoomState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.position !== seat
        ? player
        : {
            ...player,
            pawns: player.pawns.map((pawn) =>
              pawn.id === pawnId ? next : pawn,
            ),
          },
    ),
  };
}

function applyDemoMove(
  state: LudoRoomState,
  seat: number,
  move: MovePreview,
): LudoRoomState {
  let next = patchPawn(state, seat, move.pawnId, move.next);
  const captures = findCaptures(next, seat, move.next);
  for (const cap of captures) {
    next = {
      ...next,
      players: next.players.map((player) =>
        player.position !== cap.victimSeat
          ? player
          : {
              ...player,
              pawns: player.pawns.map((pawn) =>
                pawn.id === cap.victimPawnId ? sendHome(pawn) : pawn,
              ),
            },
      ),
    };
  }
  return next;
}

function perimeterPoints(count: number) {
  const inset = 8;
  const span = 100 - inset * 2;
  const side = count / 4;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i += 1) {
    const s = Math.floor(i / side);
    const t = (i % side) / side;
    if (s === 0) points.push({ x: inset + span * (1 - t), y: 100 - inset });
    else if (s === 1) points.push({ x: inset, y: 100 - inset - span * t });
    else if (s === 2) points.push({ x: inset + span * t, y: inset });
    else points.push({ x: 100 - inset, y: inset + span * t });
  }
  return points;
}
