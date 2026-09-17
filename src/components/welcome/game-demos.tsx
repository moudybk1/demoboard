"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { CaptureBurst, type CaptureEvent } from "@/components/room/capture-burst";
import { LudoBoard } from "@/components/room/ludo-board";
import { MonopolyBoard } from "@/components/room/monopoly-board";
import { pawnPoint as monopolyPawnPoint, pathForward } from "@/lib/game/board-geometry";
import { PIP_LAYOUT, randomDie, type DieValue } from "@/lib/game/dice";
import { cellCenter, pawnPoint as ludoPawnPoint } from "@/lib/game/ludo-geometry";
import {
  findCaptures,
  previewMove,
  sendHome,
  type MovePreview,
} from "@/lib/game/ludo-rules";
import { BOARD_SIZE, BOARD_TILES } from "@/lib/game/monopoly-board";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import type { LudoPawn, LudoRoomState } from "@/lib/mock/ludo";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { playWhileVisible } from "@/lib/motion/play-while-visible";
import { cn } from "@/lib/utils";

/**
 * Landing Monopoly board. Real World Tour grid with hop turns, buys, and rent.
 */
export function MonopolyDemo({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [dice, setDice] = useState<readonly [DieValue, DieValue]>([5, 2]);
  const [owners, setOwners] = useState<Record<number, number>>({});
  const [activeTile, setActiveTile] = useState<number | undefined>(0);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const pawns = Array.from(
      node.querySelectorAll<HTMLElement>("[data-mnp-pawn]"),
    );
    const die = node.querySelector<HTMLElement>("[data-mnp-dice]");
    const banner = node.querySelector<HTMLElement>("[data-mnp-banner]");
    const callout = node.querySelector<HTMLElement>("[data-mnp-callout]");
    const float = node.querySelector<HTMLElement>("[data-mnp-float]");
    const seats = [0, 0, 0, 0];

    const place = (seat: number, tile: number) => {
      const pawn = pawns[seat];
      if (!pawn) return;
      const point = monopolyPawnPoint(tile, seat + 1);
      gsap.set(pawn, {
        left: `${point.x}%`,
        top: `${point.y}%`,
        xPercent: -50,
        yPercent: -50,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        rotate: 0,
      });
    };

    pawns.forEach((_, seat) => place(seat, 0));

    const master = gsap.timeline({ repeat: -1, repeatDelay: 0.7 });

    const shout = (text: string) => {
      if (!callout) return;
      callout.textContent = text;
      gsap.fromTo(
        callout,
        { opacity: 0, y: 10, scale: 0.82 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          ease: "back.out(2.2)",
        },
      );
    };

    const floatLabel = (text: string, tile: number, seat: number) => {
      if (!float) return;
      const point = monopolyPawnPoint(tile, seat + 1);
      float.textContent = text;
      gsap.set(float, { left: `${point.x}%`, top: `${point.y}%`, opacity: 1, y: 0 });
      gsap.to(float, {
        y: -28,
        opacity: 0,
        duration: 0.85,
        ease: "power2.out",
      });
    };

    const flickers: number[] = [];
    const flickerTimers: number[] = [];

    const rollDice = (total: number) => {
      if (!die) return;
      const a = Math.min(6, Math.max(1, total - 1)) as DieValue;
      const b = Math.min(6, Math.max(1, total - a)) as DieValue;
      master.add(() => {
        const id = window.setInterval(
          () => setDice([randomDie(), randomDie()]),
          50,
        );
        flickers.push(id);
        const stop = window.setTimeout(() => {
          window.clearInterval(id);
          setDice([a, b]);
        }, 280);
        flickerTimers.push(stop);
      });
      master.to(die, {
        keyframes: [
          { x: -5, rotation: -18, y: -6, duration: 0.06 },
          { x: 6, rotation: 16, y: -14, duration: 0.07 },
          { x: -4, rotation: -12, y: -4, duration: 0.06 },
          { x: 3, rotation: 8, y: -10, duration: 0.06 },
          { x: 0, rotation: 0, y: 0, duration: 0.1 },
        ],
        ease: "power1.inOut",
      });
      master.to(die, {
        scale: 1.22,
        duration: 0.14,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2)",
      });
    };

    const hop = (seat: number, from: number, steps: number) => {
      const pawn = pawns[seat];
      if (!pawn) return;
      const path = pathForward(from, steps);
      for (const tile of path) {
        const point = monopolyPawnPoint(tile, seat + 1);
        master.to(pawn, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: 0.22,
          ease: "power2.inOut",
        });
        master.to(
          pawn,
          {
            y: -11,
            scaleY: 1.28,
            scaleX: 0.86,
            duration: 0.11,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          },
          "<",
        );
      }
      master.to(pawn, {
        scale: 1.12,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2.4)",
      });
    };

    const focusSeat = (seat: number) => {
      master.add(() => {
        pawns.forEach((pawn, index) => {
          gsap.to(pawn, {
            opacity: index === seat ? 1 : 0.38,
            scale: index === seat ? 1.08 : 0.92,
            duration: 0.22,
            ease: "power2.out",
          });
        });
        if (banner) banner.textContent = `P${seat + 1}`;
      });
    };

    const turn = (
      seat: number,
      roll: number,
      action: "buy" | "rent" | "go",
    ) => {
      const from = seats[seat];
      const land = (from + roll) % BOARD_TILES.length;
      const tile = BOARD_TILES[land];
      focusSeat(seat);
      shout(`${roll}`);
      rollDice(roll);
      hop(seat, from, roll);
      seats[seat] = land;
      master.add(() => {
        setActiveTile(land);
        if (action === "buy" && tile) {
          setOwners((prev) => ({ ...prev, [land]: seat + 1 }));
          shout(`BUY ${tile.short}`);
          floatLabel(`+${tile.short}`, land, seat);
        } else if (action === "rent" && tile) {
          shout(`RENT ${tile.short}`);
          floatLabel(`−${tile.rent ?? 10}`, land, seat);
          const victim = pawns[seat];
          if (victim) {
            gsap.fromTo(
              victim,
              { x: 0 },
              { x: 5, duration: 0.05, yoyo: true, repeat: 5, ease: "power1.inOut" },
            );
          }
        } else {
          shout("GO · COLLECT");
          floatLabel("+200", land, seat);
        }
      });
      master.to({}, { duration: 0.55 });
    };

    master.add(() => {
      seats[0] = 0;
      seats[1] = 0;
      seats[2] = 0;
      seats[3] = 0;
      setOwners({});
      setActiveTile(0);
      setDice([5, 2]);
      pawns.forEach((_, seat) => place(seat, 0));
      if (banner) banner.textContent = "MONOPOLY";
      if (callout) callout.textContent = "";
    });

    turn(0, 6, "buy");
    turn(1, 3, "buy");
    turn(2, 6, "rent");
    turn(0, 7, "buy");
    turn(3, 6, "rent");

    master.add(() => {
      pawns.forEach((pawn) => {
        gsap.to(pawn, { opacity: 1, scale: 1, duration: 0.25 });
      });
      if (banner) banner.textContent = "MONOPOLY";
      shout("POT FIGHT");
    });
    master.to({}, { duration: 0.8 });

    const stopVisibilityGate = playWhileVisible(node, () => [master]);

    return () => {
      stopVisibilityGate();
      master.kill();
      flickers.forEach((id) => window.clearInterval(id));
      flickerTimers.forEach((id) => window.clearTimeout(id));
      pawns.forEach((pawn) => gsap.killTweensOf(pawn));
      if (die) gsap.killTweensOf(die);
      if (callout) gsap.killTweensOf(callout);
      if (float) gsap.killTweensOf(float);
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn("relative aspect-square w-full", className)}
      aria-hidden
    >
      <MonopolyBoard
        owners={owners}
        activeTile={activeTile}
        overlay={
          <>
            {[1, 2, 3, 4].map((seat) => (
              <div
                key={seat}
                data-mnp-pawn
                className="absolute z-10 will-change-transform drop-shadow-[2px_2px_0_rgba(45,23,12,0.75)]"
                style={{
                  width: `${(100 / BOARD_SIZE) * 0.5}%`,
                  minWidth: 12,
                  left: "92%",
                  top: "92%",
                }}
              >
                <PixelArt sprite={pawnSprite(seat)} />
              </div>
            ))}
            <p
              data-mnp-float
              className="pointer-events-none absolute z-20 font-pixel text-[10px] font-bold text-gold text-shadow-pixel opacity-0"
              style={{ transform: "translate(-50%, -50%)" }}
            />
            <div className="absolute bottom-[3%] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1">
              <div data-mnp-dice className="flex items-center gap-1">
                <DemoDie face={dice[0]} />
                <DemoDie face={dice[1]} />
              </div>
              <p
                data-mnp-banner
                className="font-pixel text-[clamp(8px,1.4vw,10px)] text-cream text-shadow-pixel"
              >
                MONOPOLY
              </p>
              <p
                data-mnp-callout
                className="min-h-4 font-pixel text-[clamp(8px,1.4vw,11px)] uppercase tracking-wide text-gold"
              />
            </div>
          </>
        }
      />
    </div>
  );
}

/**
 * Landing Ludo board. Real geometry with 6-to-leave, captures, and home.
 */
export function LudoDemo({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [dieFace, setDieFace] = useState<DieValue>(6);
  const [burst, setBurst] = useState<CaptureEvent | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const die = node.querySelector<HTMLElement>("[data-lud-die]");
    const callout = node.querySelector<HTMLElement>("[data-lud-callout]");
    const pawnEls = new Map<string, HTMLElement>();
    node.querySelectorAll<HTMLElement>("[data-lud-pawn]").forEach((el) => {
      const id = el.dataset.ludPawn;
      if (id) pawnEls.set(id, el);
    });

    let state = createDemoState();
    const bobByEl = new Map<HTMLElement, gsap.core.Tween>();
    const master = gsap.timeline({ repeat: -1, repeatDelay: 0.85 });
    const flickers: number[] = [];
    const flickerTimers: number[] = [];

    const shout = (text: string) => {
      if (!callout) return;
      callout.textContent = text;
      gsap.fromTo(
        callout,
        { opacity: 0, y: 8, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          ease: "back.out(2.4)",
        },
      );
    };

    const stopBob = (el: HTMLElement) => {
      bobByEl.get(el)?.kill();
      bobByEl.delete(el);
      gsap.set(el, { y: 0 });
    };

    const startBob = (el: HTMLElement) => {
      stopBob(el);
      const bob = gsap.to(el, {
        y: -4,
        duration: 0.9,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() * 0.4,
      });
      bobByEl.set(el, bob);
    };

    const placeAll = () => {
      for (const player of state.players) {
        for (const pawn of player.pawns) {
          const el = pawnEls.get(pawn.id);
          const point = ludoPawnPoint(player.position, pawn);
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
            opacity: pawn.status === "finished" ? 0.5 : 1,
            filter: "none",
          });
          startBob(el);
        }
      }
    };

    placeAll();

    const flashCell = (row: number, col: number) => {
      const cell = node.querySelector<HTMLElement>(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (!cell) return;
      gsap.fromTo(
        cell,
        { filter: "brightness(1.7)" },
        { filter: "brightness(1)", duration: 0.35, ease: "power1.out" },
      );
    };

    const setDie = (value: DieValue) => {
      if (!die) return;
      master.add(() => {
        const id = window.setInterval(() => setDieFace(randomDie()), 45);
        flickers.push(id);
        const stop = window.setTimeout(() => {
          window.clearInterval(id);
          setDieFace(value);
        }, 260);
        flickerTimers.push(stop);
      });
      master.to(die, {
        keyframes: [
          { x: -4, rotation: -16, y: -8, duration: 0.05 },
          { x: 5, rotation: 14, y: -16, duration: 0.06 },
          { x: -5, rotation: -12, y: -4, duration: 0.05 },
          { x: 3, rotation: 9, y: -10, duration: 0.05 },
          { x: 0, rotation: 0, y: 0, duration: 0.08 },
        ],
        ease: "power1.inOut",
      });
      master.to(die, {
        scale: 1.2,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2)",
      });
    };

    const hopPath = (el: HTMLElement, path: [number, number][]) => {
      for (const [row, col] of path) {
        const point = cellCenter(row, col);
        master.add(() => flashCell(row, col));
        master.to(el, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          duration: 0.16,
          ease: "power2.inOut",
        });
        master.to(
          el,
          {
            y: -10,
            scaleY: 1.22,
            scaleX: 0.84,
            duration: 0.08,
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
      master.to({}, { duration: 0.08 });

      const player = state.players.find((p) => p.position === seat);
      const pawn = player?.pawns.find((p) => p.id === pawnId);
      const el = pawnEls.get(pawnId);
      if (!player || !pawn || !el) return;

      const move = previewMove(state, seat, pawn, roll);
      if (!move) {
        shout(roll === 6 ? "BLOCKED" : "NEED A 6");
        master.add(() => stopBob(el));
        master.to(el, {
          x: 5,
          duration: 0.05,
          yoyo: true,
          repeat: 5,
          ease: "power1.inOut",
        });
        master.set(el, { x: 0 });
        master.add(() => startBob(el));
        master.to({}, { duration: 0.32 });
        return;
      }

      const staged = patchPawn(state, seat, move.pawnId, move.next);
      const captures = findCaptures(staged, seat, move.next);
      state = applyDemoMove(state, seat, move);

      if (pawn.status === "yard" && roll === 6) shout("OUT!");
      else if (move.next.status === "finished") shout("HOME!");
      else shout(`${roll}`);

      master.add(() => {
        stopBob(el);
        gsap.to(el, { scale: 1.18, duration: 0.12, ease: "back.out(2)" });
      });
      hopPath(el, move.path);

      if (captures.length) {
        master.add(() => {
          shout("CAPTURED!");
          for (const cap of captures) {
            const victim = pawnEls.get(cap.victimPawnId);
            const victimPawn = state.players
              .find((p) => p.position === cap.victimSeat)
              ?.pawns.find((p) => p.id === cap.victimPawnId);
            if (!victim || !victimPawn) continue;
            const pad = ludoPawnPoint(cap.victimSeat, victimPawn);
            const hit = move.path[move.path.length - 1];
            if (hit) {
              const at = cellCenter(hit[0], hit[1]);
              setBurst({
                id: `${cap.victimPawnId}-${Date.now()}`,
                x: at.x,
                y: at.y,
                victimSeat: cap.victimSeat,
              });
            }
            if (!pad) continue;
            stopBob(victim);
            gsap.to(victim, {
              scale: 0.2,
              opacity: 0.2,
              duration: 0.18,
              ease: "power2.in",
              onComplete: () => {
                gsap.set(victim, {
                  left: `${pad.x}%`,
                  top: `${pad.y}%`,
                  scale: 1,
                  opacity: 1,
                });
                gsap.fromTo(
                  victim,
                  { scale: 0.4, y: -12 },
                  {
                    scale: 1,
                    y: 0,
                    duration: 0.28,
                    ease: "back.out(2.2)",
                    onComplete: () => startBob(victim),
                  },
                );
              },
            });
          }
        });
        master.to({}, { duration: 0.55 });
      } else {
        master.to({}, { duration: 0.22 });
      }

      master.add(() => {
        gsap.to(el, { scale: 1, duration: 0.16, ease: "power2.out" });
        startBob(el);
      });
    };

    const jumpPawn = (seat: number, pawnId: string, next: LudoPawn) => {
      state = patchPawn(state, seat, pawnId, next);
      const point = ludoPawnPoint(seat, next);
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

    master.add(() => {
      state = createDemoState();
      setBurst(null);
      setDieFace(6);
      placeAll();
      shout("LUDO");
    });

    attempt(1, 3, "p1-0");
    attempt(1, 6, "p1-0");
    attempt(1, 5, "p1-0");
    attempt(2, 6, "p2-0");
    attempt(2, 6, "p2-0");
    attempt(1, 6, "p1-0");
    attempt(1, 5, "p1-0");
    attempt(1, 4, "p1-0");
    jumpPawn(1, "p1-0", { id: "p1-0", index: 0, status: "home", steps: 3 });
    master.to({}, { duration: 0.2 });
    attempt(1, 2, "p1-0");
    master.to({}, { duration: 0.7 });

    const stopVisibilityGate = playWhileVisible(node, () => [
      master,
      ...bobByEl.values(),
    ]);

    return () => {
      stopVisibilityGate();
      master.kill();
      flickers.forEach((id) => window.clearInterval(id));
      flickerTimers.forEach((id) => window.clearTimeout(id));
      bobByEl.forEach((tween) => tween.kill());
      bobByEl.clear();
      pawnEls.forEach((el) => gsap.killTweensOf(el));
      if (die) gsap.killTweensOf(die);
      if (callout) gsap.killTweensOf(callout);
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
        overlay={
          <>
            {pawns.map((pawn) => (
              <div
                key={pawn.id}
                data-lud-pawn={pawn.id}
                className="absolute z-20 w-[7.5%] will-change-transform drop-shadow-[1px_1px_0_rgba(45,23,12,0.7)]"
                style={{ left: "50%", top: "50%" }}
              >
                <PixelArt sprite={pawnSprite(pawn.seat)} />
              </div>
            ))}
            {burst ? (
              <CaptureBurst event={burst} onDone={() => setBurst(null)} />
            ) : null}
            <div className="pointer-events-none absolute bottom-[2.5%] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1">
              <DemoDie face={dieFace} marker="lud-die" />
              <p
                data-lud-callout
                className="font-pixel text-[clamp(8px,1.5vw,11px)] uppercase tracking-wide text-gold text-shadow-pixel"
              >
                LUDO
              </p>
            </div>
          </>
        }
      />
    </div>
  );
}

function DemoDie({
  face,
  marker,
}: {
  face: DieValue;
  marker?: "lud-die";
}) {
  const pips = PIP_LAYOUT[face];
  return (
    <div
      data-lud-die={marker === "lud-die" ? "" : undefined}
      className="grid size-7 grid-cols-3 grid-rows-3 gap-[2px] border-[3px] border-void bg-cream p-[3px] shadow-pixel-sm sm:size-8"
      style={{ transformOrigin: "50% 80%" }}
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span
          key={cell}
          className={pips.includes(cell) ? "bg-void" : "bg-transparent"}
        />
      ))}
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
