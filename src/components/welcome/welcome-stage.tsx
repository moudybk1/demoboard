"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { PIP_LAYOUT, randomDie, type DieValue } from "@/lib/game/dice";
import {
  BOARD_SIZE,
  BOARD_TILES,
  groupFor,
  isCorner,
  tilePlacement,
  type BoardTile,
  type TileEdge,
} from "@/lib/game/monopoly-board";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { playWhileVisible } from "@/lib/motion/play-while-visible";
import { cn } from "@/lib/utils";

const BAR_POSITION: Record<TileEdge, string> = {
  bottom: "top-0 left-0 right-0 h-[26%] border-b-2 border-void",
  left: "top-0 right-0 bottom-0 w-[26%] border-l-2 border-void",
  top: "bottom-0 left-0 right-0 h-[26%] border-t-2 border-void",
  right: "top-0 left-0 bottom-0 w-[26%] border-r-2 border-void",
};

const CORNER_LABEL: Record<string, string> = {
  go: "GO",
  jail: "JAIL",
  vault: "FREE",
  "go-to-jail": "JAIL",
};

const SCRIPT = [
  { seat: 0, steps: 7, label: "Rent collected!" },
  { seat: 1, steps: 5, label: "Property bought!" },
  { seat: 2, steps: 8, label: "Passed GO!" },
  { seat: 3, steps: 4, label: "Rent collected!" },
] as const;

const PLAYERS = [
  { seat: 1, name: "P1" },
  { seat: 2, name: "P2" },
  { seat: 3, name: "P3" },
  { seat: 4, name: "P4" },
] as const;

type KickTurn = (seat?: number) => void;

/**
 * Compact labeled demo preview: four avatars, a small board, and one
 * readable turn (roll → hop → event bubble), then it settles.
 */
export function WelcomeStage({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const kickRef = useRef<KickTurn | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false);
  const pauseReady = useRef(false);
  const [paused, setPaused] = useState(false);
  const [activeSeat, setActiveSeat] = useState(1);
  const [eventText, setEventText] = useState("Rent collected!");
  const [dice, setDice] = useState<readonly [DieValue, DieValue]>([4, 3]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const stage = root.current;
    const boardNode = board.current;
    if (!stage || !boardNode) return;

    const reducedMotion = prefersReducedMotion();
    setReduced(reducedMotion);

    const tileNodes = Array.from(
      boardNode.querySelectorAll<HTMLElement>("[data-hero-tile]"),
    ).sort(
      (a, b) => Number(a.dataset.index ?? 0) - Number(b.dataset.index ?? 0),
    );
    const pawns = Array.from(
      boardNode.querySelectorAll<HTMLElement>("[data-hero-pawn]"),
    );

    const centerOf = (index: number) => {
      const tile = tileNodes[index % tileNodes.length];
      if (!tile) return { x: 50, y: 50 };
      const br = boardNode.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      if (br.width < 1 || br.height < 1) return { x: 50, y: 50 };
      return {
        x: ((tr.left + tr.width / 2 - br.left) / br.width) * 100,
        y: ((tr.top + tr.height / 2 - br.top) / br.height) * 100,
      };
    };

    pawns.forEach((pawn, seat) => {
      const start = seat * (BOARD_SIZE - 1);
      const point = centerOf(start);
      gsap.set(pawn, {
        left: `${point.x}%`,
        top: `${point.y}%`,
        xPercent: -50,
        yPercent: -50,
      });
      pawn.dataset.tile = String(start);
    });

    if (reducedMotion) return;

    const tweens: gsap.core.Animation[] = [];
    let busy = false;
    let scriptIndex = 0;
    let waitTimer = 0;
    const die = stage.querySelector<HTMLElement>("[data-preview-dice]");
    const bubble = stage.querySelector<HTMLElement>("[data-preview-event]");

    const flashTile = (index: number) => {
      const tile = tileNodes[index % tileNodes.length];
      if (!tile) return;
      gsap.fromTo(
        tile,
        { filter: "brightness(1)" },
        {
          filter: "brightness(1.85)",
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power1.out",
        },
      );
    };

    const showEvent = (text: string) => {
      setEventText(text);
      if (!bubble) return;
      gsap.fromTo(
        bubble,
        { opacity: 0, y: 8, scale: 0.86 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          ease: "back.out(2.1)",
        },
      );
    };

    const runHop = (
      seat: number,
      steps: number,
      label: string,
      done: () => void,
    ) => {
      const pawn = pawns[seat];
      if (!pawn || steps < 1) {
        done();
        return;
      }

      busy = true;
      setActiveSeat(seat + 1);
      const body = pawn.querySelector<HTMLElement>("[data-pawn-body]");
      const from = Number(pawn.dataset.tile ?? "0");
      const stepDur = steps >= 8 ? 0.12 : steps >= 5 ? 0.15 : 0.18;
      const tl = gsap.timeline({
        onComplete: () => {
          showEvent(label);
          if (body) {
            gsap.fromTo(
              body,
              { rotate: -8 },
              {
                rotate: 8,
                duration: 0.08,
                yoyo: true,
                repeat: 3,
                ease: "power1.inOut",
                onComplete: () => gsap.set(body, { rotate: 0 }),
              },
            );
          }
          busy = false;
          done();
        },
      });
      tweens.push(tl);

      if (die) {
        tl.to(die, {
          keyframes: [
            { x: -4, rotation: -14, duration: 0.05 },
            { x: 5, rotation: 12, duration: 0.06 },
            { x: -3, rotation: -8, duration: 0.05 },
            { x: 0, rotation: 0, duration: 0.08 },
          ],
          ease: "power1.inOut",
        });
      }

      for (let step = 1; step <= steps; step += 1) {
        const idx = (from + step) % Math.max(tileNodes.length, 1);
        const next = centerOf(idx);
        const isLast = step === steps;

        tl.to(pawn, {
          left: `${next.x}%`,
          top: `${next.y}%`,
          duration: stepDur,
          ease: "none",
          onStart: () => {
            flashTile(idx);
            pawn.dataset.tile = String(idx);
          },
        });

        if (body) {
          tl.to(
            body,
            {
              y: isLast ? -14 : -9,
              scaleY: 1.18,
              scaleX: 0.9,
              duration: stepDur * 0.42,
              ease: "power2.out",
            },
            "<",
          )
            .to(body, {
              y: 0,
              scaleY: 0.9,
              scaleX: 1.1,
              duration: stepDur * 0.38,
              ease: "power2.in",
            })
            .to(body, {
              scaleY: 1,
              scaleX: 1,
              duration: stepDur * 0.2,
              ease: "power1.out",
            });
        }
      }
    };

    const scheduleNext = () => {
      window.clearTimeout(waitTimer);
      waitTimer = window.setTimeout(() => {
        if (pausedRef.current || busy) return;
        playScripted();
      }, 2200);
    };

    const playScripted = () => {
      if (busy || pausedRef.current) return;
      const beat = SCRIPT[scriptIndex % SCRIPT.length];
      scriptIndex += 1;
      const a = Math.min(6, Math.max(1, beat.steps - 3)) as DieValue;
      const b = Math.min(6, Math.max(1, beat.steps - a)) as DieValue;
      setDice([a, b]);
      runHop(beat.seat, beat.steps, beat.label, scheduleNext);
    };

    const kick: KickTurn = (seat) => {
      if (busy) return;
      window.clearTimeout(waitTimer);
      const chosen = seat ?? Math.max(0, (activeSeatFromDom() ?? 1) - 1);
      const total = randomDie() + randomDie();
      const a = Math.min(6, Math.max(1, total - 1)) as DieValue;
      const b = Math.min(6, Math.max(1, total - a)) as DieValue;
      setDice([a, b]);
      const labels = SCRIPT.map((item) => item.label);
      const label = labels[chosen % labels.length] ?? "Rent collected!";
      runHop(chosen, total, label, () => {
        if (!pausedRef.current) scheduleNext();
      });
    };

    const activeSeatFromDom = () => {
      const marked = stage.querySelector<HTMLElement>(
        "[data-hero-avatar][data-active='true']",
      );
      return marked ? Number(marked.dataset.heroAvatar) : 1;
    };

    kickRef.current = kick;
    resumeRef.current = () => {
      if (!pausedRef.current && !busy) scheduleNext();
    };
    playScripted();

    const onResize = () => {
      pawns.forEach((pawn) => {
        const idx = Number(pawn.dataset.tile ?? "0");
        const point = centerOf(idx);
        gsap.set(pawn, { left: `${point.x}%`, top: `${point.y}%` });
      });
    };
    window.addEventListener("resize", onResize);
    const stopVisibilityGate = playWhileVisible(stage, () => tweens);

    return () => {
      stopVisibilityGate();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(waitTimer);
      kickRef.current = null;
      resumeRef.current = null;
      tweens.forEach((t) => t.kill());
      pawns.forEach((p) => {
        gsap.killTweensOf(p);
        const body = p.querySelector<HTMLElement>("[data-pawn-body]");
        if (body) gsap.killTweensOf(body);
      });
      if (die) gsap.killTweensOf(die);
      if (bubble) gsap.killTweensOf(bubble);
    };
  }, []);

  useEffect(() => {
    if (!pauseReady.current) {
      pauseReady.current = true;
      return;
    }
    if (!paused) resumeRef.current?.();
  }, [paused]);

  return (
    <div id="demo-preview" ref={root} className={cn("w-full", className)}>
      <p className="mb-2 font-pixel text-xs font-semibold uppercase tracking-wider text-cream text-shadow-pixel">
        Demo preview
      </p>
      <PixelCard size="md" tone="cream" faceClassName="p-3 sm:p-4">
        <div className="mb-3 flex items-end justify-center gap-2 sm:gap-3">
          {PLAYERS.map((player) => {
            const active = player.seat === activeSeat;
            return (
              <button
                key={player.seat}
                type="button"
                data-hero-avatar={player.seat}
                data-active={active ? "true" : "false"}
                aria-pressed={active}
                aria-label={`${player.name}${active ? ", rolling" : ""}`}
                className={cn(
                  "flex w-12 flex-col items-center gap-1 rounded-sm border-2 bg-surface px-1 py-1 transition-transform duration-150 sm:w-14",
                  active
                    ? "border-gold shadow-pixel-sm"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                onClick={() => {
                  setActiveSeat(player.seat);
                  kickRef.current?.(player.seat - 1);
                }}
              >
                <span
                  className={cn(
                    "block w-8 sm:w-9",
                    active && !reduced && "animate-pawn-bounce",
                  )}
                >
                  <PixelArt sprite={pawnSprite(player.seat)} />
                </span>
                <span className="font-pixel text-[10px] uppercase leading-none text-parchment">
                  {player.name}
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={board}
          className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[24rem]"
        >
          <div
            className="relative grid h-full w-full gap-[2px] border-[3px] border-edge-bright bg-[#020b16] p-[2px] shadow-pixel-sm"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {BOARD_TILES.map((tile) => {
              const { row, col, edge } = tilePlacement(tile.index);
              return (
                <HeroTile
                  key={tile.index}
                  tile={tile}
                  edge={edge}
                  style={{ gridRow: row, gridColumn: col }}
                />
              );
            })}

            <div
              style={{ gridArea: `2 / 2 / ${BOARD_SIZE} / ${BOARD_SIZE}` }}
              className="relative overflow-hidden border border-void/80 bg-ink"
            >
              <div
                data-preview-dice
                className="absolute inset-x-0 top-[12%] z-20 flex items-center justify-center gap-1.5"
              >
                <PreviewDie face={dice[0]} />
                <PreviewDie face={dice[1]} />
              </div>

              <div
                data-preview-event
                role="status"
                aria-live="polite"
                className="absolute inset-x-2 bottom-[14%] z-30 mx-auto max-w-[90%] border-[3px] border-void bg-gold px-2 py-1.5 text-center shadow-pixel-sm"
              >
                <p className="font-pixel text-[11px] font-bold uppercase leading-none text-void sm:text-xs">
                  {eventText}
                </p>
              </div>
            </div>

            {[1, 2, 3, 4].map((seat) => (
              <div
                key={seat}
                data-hero-pawn
                data-tile={String((seat - 1) * (BOARD_SIZE - 1))}
                className={cn(
                  "absolute z-30 w-[8.5%] min-w-[1.1rem] will-change-transform",
                  seat === activeSeat && "z-40",
                )}
                style={{ left: "50%", top: "50%" }}
              >
                <div
                  data-pawn-body
                  className={cn(
                    "will-change-transform",
                    seat === activeSeat &&
                      "rounded-sm outline outline-2 outline-offset-1 outline-gold",
                  )}
                >
                  <PixelArt sprite={pawnSprite(seat)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <PixelButton
            type="button"
            size="sm"
            variant="primary"
            onClick={() => kickRef.current?.(activeSeat - 1)}
          >
            Try a roll
          </PixelButton>
          <PixelButton
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Play preview" : "Pause preview"}
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
}

function PreviewDie({ face }: { face: DieValue }) {
  const pips = PIP_LAYOUT[face];
  return (
    <div className="grid size-7 grid-cols-3 grid-rows-3 gap-[2px] border-[3px] border-void bg-cream p-[3px] shadow-pixel-sm sm:size-8">
      {Array.from({ length: 9 }, (_, cell) => (
        <span
          key={cell}
          className={pips.includes(cell) ? "bg-void" : "bg-transparent"}
        />
      ))}
    </div>
  );
}

function HeroTile({
  tile,
  edge,
  style,
}: {
  tile: BoardTile;
  edge: TileEdge;
  style: React.CSSProperties;
}) {
  const group = groupFor(tile);
  const corner = isCorner(tile.index);
  const isCountry = tile.kind === "country";

  return (
    <div
      data-hero-tile
      data-index={tile.index}
      style={{
        ...style,
        backgroundColor: tileTone(tile, corner),
      }}
      className="relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden outline outline-1 outline-void"
    >
      {group && isCountry ? (
        <span
          aria-hidden
          className={cn("absolute z-[1]", BAR_POSITION[edge])}
          style={{ backgroundColor: group.color }}
        />
      ) : null}

      {corner ? (
        <span className="relative z-[2] px-0.5 text-center font-pixel text-[clamp(5px,0.85vw,10px)] leading-none text-void">
          {CORNER_LABEL[tile.kind] ?? tile.short}
        </span>
      ) : (
        <span
          className={cn(
            "relative z-[2] max-w-full truncate px-0.5 text-center font-pixel leading-none text-void/85",
            edge === "left" || edge === "right"
              ? "text-[clamp(3px,0.5vw,6px)] [writing-mode:vertical-rl] rotate-180"
              : "text-[clamp(3px,0.5vw,6px)]",
          )}
        >
          {tile.short}
        </span>
      )}
    </div>
  );
}

function tileTone(tile: BoardTile, corner: boolean): string {
  if (corner) return "color-mix(in srgb, var(--color-gold) 26%, #fff3d6)";
  switch (tile.kind) {
    case "chance":
      return "color-mix(in srgb, var(--color-ludo) 30%, #fff3d6)";
    case "treasury":
      return "color-mix(in srgb, var(--color-monopoly) 30%, #fff3d6)";
    case "airport":
      return "color-mix(in srgb, var(--color-edge) 28%, #fff3d6)";
    case "burn":
      return "color-mix(in srgb, var(--color-danger) 26%, #fff3d6)";
    default:
      return "#fff3d6";
  }
}
