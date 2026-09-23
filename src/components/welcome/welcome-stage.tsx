"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { PixelButton } from "@/components/ui/pixel-button";
import { PIP_LAYOUT, type DieValue } from "@/lib/game/dice";
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

type TurnPhase = "ready" | "rolling" | "moving" | "result";

type GuidedBeat = {
  seat: number;
  /** Place the active pawn here before the roll so destination math stays true. */
  startTile: number;
  dieA: DieValue;
  dieB: DieValue;
  /** Plain-language outcome after the hop. Must match dice total and destination. */
  result: string;
  /** Balance delta shown in the center after the turn. */
  balanceNote: string;
};

/**
 * Predetermined guided turn. Dice total, hop count, destination, and copy
 * stay in sync against the real 48-tile track. Seat 0 is “you”.
 */
const GUIDED: readonly GuidedBeat[] = [
  {
    seat: 0,
    startTile: 0,
    dieA: 4,
    dieB: 5,
    // 0 + 9 → Rome (9)
    result: "You landed on Rome. Bought it for 120 $BOARD.",
    balanceNote: "You · 1,000 → 880 $BOARD",
  },
  {
    seat: 1,
    startTile: 6,
    dieA: 2,
    dieB: 1,
    // 6 + 3 → Rome (9)
    result: "Teal landed on your Rome. You collected 120 $BOARD in rent.",
    balanceNote: "You · +120 · Teal paid rent",
  },
  {
    seat: 2,
    startTile: 44,
    dieA: 3,
    dieB: 3,
    // 44 + 6 → tile 2 (passes GO)
    result: "Coral passed GO and collected 200 $BOARD.",
    balanceNote: "Coral · +200 GO bonus",
  },
  {
    seat: 3,
    startTile: 10,
    dieA: 2,
    dieB: 1,
    // 10 + 3 → Paris (13)
    result: "Red bought Paris. A new street joins the fight.",
    balanceNote: "Red · −140 $BOARD",
  },
] as const;

const PLAYERS = [
  { seat: 1, name: "You", shape: "Pawn" },
  { seat: 2, name: "Teal", shape: "Helm" },
  { seat: 3, name: "Coral", shape: "Tower" },
  { seat: 4, name: "Red", shape: "Star" },
] as const;

type KickTurn = () => void;
type ReplayTurn = () => void;

/**
 * Guided public turn: roll → hop → destination flash → plain-language result.
 * Center of the board carries the explanation; avatars are turn status only.
 */
export function WelcomeStage({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const kickRef = useRef<KickTurn | null>(null);
  const replayRef = useRef<ReplayTurn | null>(null);
  const pausedRef = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const pauseReady = useRef(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeSeat, setActiveSeat] = useState(1);
  const [phase, setPhase] = useState<TurnPhase>("ready");
  const [centerText, setCenterText] = useState("Your turn. Roll the dice.");
  const [balanceNote, setBalanceNote] = useState("Four players · one board · one winner");
  const [dice, setDice] = useState<readonly [DieValue, DieValue]>([4, 5]);
  const [hotTile, setHotTile] = useState<number | null>(null);
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

    const resetPawns = () => {
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
    };

    resetPawns();

    if (reducedMotion) {
      const placePawn = (seat: number, tile: number) => {
        const pawn = pawns[seat];
        if (!pawn) return;
        const point = centerOf(tile);
        gsap.set(pawn, {
          left: `${point.x}%`,
          top: `${point.y}%`,
          xPercent: -50,
          yPercent: -50,
        });
        pawn.dataset.tile = String(tile % Math.max(tileNodes.length, 1));
      };
      kickRef.current = () => {
        const beat = GUIDED[0];
        if (!beat) return;
        const total = beat.dieA + beat.dieB;
        setDice([beat.dieA, beat.dieB]);
        setActiveSeat(beat.seat + 1);
        setPhase("result");
        setCenterText(`Rolled ${total}. ${beat.result}`);
        setBalanceNote(beat.balanceNote);
        const dest =
          (beat.startTile + total) % Math.max(tileNodes.length, 1);
        setHotTile(dest);
        placePawn(beat.seat, dest);
      };
      replayRef.current = () => {
        resetPawns();
        setBusy(false);
        setPhase("ready");
        setHotTile(null);
        setActiveSeat(1);
        setCenterText("Your turn. Roll the dice.");
        setBalanceNote("Four players · one board · one winner");
        setDice([4, 5]);
      };
      return;
    }

    const tweens: gsap.core.Animation[] = [];
    let busyLocal = false;
    let scriptIndex = 0;
    let waitTimer = 0;
    const die = stage.querySelector<HTMLElement>("[data-preview-dice]");
    const bubble = stage.querySelector<HTMLElement>("[data-preview-event]");

    const setBusyBoth = (value: boolean) => {
      busyLocal = value;
      setBusy(value);
    };

    const flashTile = (index: number, hold = false) => {
      const tile = tileNodes[index % tileNodes.length];
      if (!tile) return;
      if (hold) {
        setHotTile(index);
        return;
      }
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

    const showCenter = (text: string, note?: string) => {
      setCenterText(text);
      if (note) setBalanceNote(note);
      if (!bubble) return;
      gsap.fromTo(
        bubble,
        { opacity: 0, y: 6, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power2.out",
        },
      );
    };

    const placePawn = (seat: number, tile: number) => {
      const pawn = pawns[seat];
      if (!pawn) return;
      const point = centerOf(tile);
      gsap.set(pawn, {
        left: `${point.x}%`,
        top: `${point.y}%`,
        xPercent: -50,
        yPercent: -50,
      });
      pawn.dataset.tile = String(tile % Math.max(tileNodes.length, 1));
    };

    const runHop = (beat: GuidedBeat, done: () => void) => {
      const pawn = pawns[beat.seat];
      const steps = beat.dieA + beat.dieB;
      if (!pawn || steps < 1) {
        done();
        return;
      }

      placePawn(beat.seat, beat.startTile);

      setBusyBoth(true);
      setActiveSeat(beat.seat + 1);
      setPhase("rolling");
      setDice([beat.dieA, beat.dieB]);
      showCenter(`Rolled ${steps}. Moving ${steps} spaces…`);

      const body = pawn.querySelector<HTMLElement>("[data-pawn-body]");
      const from = beat.startTile % Math.max(tileNodes.length, 1);
      const dest = (from + steps) % Math.max(tileNodes.length, 1);
      const stepDur = steps >= 8 ? 0.11 : steps >= 5 ? 0.14 : 0.16;
      const tl = gsap.timeline({
        onComplete: () => {
          setPhase("result");
          flashTile(dest, true);
          showCenter(beat.result, beat.balanceNote);
          if (body) {
            gsap.fromTo(
              body,
              { rotate: -6 },
              {
                rotate: 6,
                duration: 0.07,
                yoyo: true,
                repeat: 3,
                ease: "power1.inOut",
                onComplete: () => gsap.set(body, { rotate: 0 }),
              },
            );
          }
          setBusyBoth(false);
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
          onComplete: () => setPhase("moving"),
        });
      } else {
        tl.add(() => setPhase("moving"));
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
        if (pausedRef.current || busyLocal) return;
        playScripted();
      }, 2800);
    };

    const playScripted = () => {
      if (busyLocal || pausedRef.current) return;
      const beat = GUIDED[scriptIndex % GUIDED.length];
      if (!beat) return;
      scriptIndex += 1;
      setHotTile(null);
      runHop(beat, scheduleNext);
    };

    const kick: KickTurn = () => {
      if (busyLocal) return;
      window.clearTimeout(waitTimer);
      const beat = GUIDED[scriptIndex % GUIDED.length];
      if (!beat) return;
      scriptIndex += 1;
      setHotTile(null);
      runHop(beat, () => {
        if (!pausedRef.current) scheduleNext();
      });
    };

    const replay: ReplayTurn = () => {
      window.clearTimeout(waitTimer);
      tweens.forEach((t) => t.kill());
      tweens.length = 0;
      pawns.forEach((p) => {
        gsap.killTweensOf(p);
        const body = p.querySelector<HTMLElement>("[data-pawn-body]");
        if (body) gsap.killTweensOf(body);
      });
      if (die) gsap.killTweensOf(die);
      if (bubble) gsap.killTweensOf(bubble);
      scriptIndex = 0;
      setBusyBoth(false);
      setPhase("ready");
      setHotTile(null);
      setActiveSeat(1);
      setDice([4, 5]);
      showCenter("Your turn. Roll the dice.", "Four players · one board · one winner");
      resetPawns();
      if (!pausedRef.current) {
        waitTimer = window.setTimeout(() => {
          if (!pausedRef.current) playScripted();
        }, 900);
      }
    };

    kickRef.current = kick;
    replayRef.current = replay;
    resumeRef.current = () => {
      if (!pausedRef.current && !busyLocal) scheduleNext();
    };
    showCenter("Your turn. Roll the dice.", "Four players · one board · one winner");
    waitTimer = window.setTimeout(() => {
      if (!pausedRef.current) playScripted();
    }, 700);

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
      replayRef.current = null;
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

  const onRoll = useCallback(() => {
    if (busy) return;
    kickRef.current?.();
  }, [busy]);

  const onReplay = useCallback(() => {
    replayRef.current?.();
  }, []);

  return (
    <div
      id="try-a-turn"
      ref={root}
      className={cn("w-full scroll-mt-28", className)}
    >
      <div className="border-[3px] border-void bg-cream p-2.5 shadow-pixel sm:p-3.5">
        <div
          className="mb-2.5 flex items-end justify-center gap-1.5 sm:mb-3 sm:gap-2.5"
          role="list"
          aria-label="Player turn status"
        >
          {PLAYERS.map((player) => {
            const active = player.seat === activeSeat;
            return (
              <div
                key={player.seat}
                role="listitem"
                data-hero-avatar={player.seat}
                data-active={active ? "true" : "false"}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-12 flex-col items-center gap-1 rounded-sm border-2 bg-surface px-1 py-1 sm:w-14 sm:py-1.5",
                  active
                    ? "border-gold shadow-pixel-sm"
                    : "border-transparent opacity-65",
                )}
              >
                <span
                  className={cn(
                    "block w-7 sm:w-8",
                    active && !reduced && phase !== "result" && "animate-pawn-bounce",
                  )}
                >
                  <PixelArt sprite={pawnSprite(player.seat)} />
                </span>
                <span className="font-pixel text-[10px] uppercase leading-none text-parchment">
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>

        <div
          ref={board}
          className="relative mx-auto aspect-square w-full max-w-[min(100%,32rem)]"
        >
          <div
            className="relative grid h-full w-full gap-[2px] border-[3px] border-edge-bright bg-[#173C32] p-[2px] shadow-pixel-sm"
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
                  hot={hotTile === tile.index}
                  style={{ gridRow: row, gridColumn: col }}
                />
              );
            })}

            <div
              style={{ gridArea: `2 / 2 / ${BOARD_SIZE} / ${BOARD_SIZE}` }}
              className="relative overflow-hidden border border-void/80 bg-[#0f2922]"
            >
              <div
                data-preview-dice
                className="absolute inset-x-0 top-[8%] z-20 flex items-center justify-center gap-1.5"
              >
                <PreviewDie face={dice[0]} />
                <PreviewDie face={dice[1]} />
                <span className="ml-1 font-pixel text-xs font-bold text-cream">
                  = {dice[0] + dice[1]}
                </span>
              </div>

              <div
                data-preview-event
                role="status"
                aria-live="polite"
                className="absolute inset-x-2 bottom-[8%] top-[28%] z-30 mx-auto flex max-w-[92%] flex-col items-center justify-center gap-2 px-2 text-center"
              >
                <p className="border-[3px] border-void bg-gold px-2.5 py-2 font-sans text-[13px] font-semibold leading-snug text-void shadow-pixel-sm sm:text-sm">
                  {centerText}
                </p>
                <p className="font-pixel text-[10px] uppercase leading-snug tracking-wide text-cream/90">
                  {balanceNote}
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

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:mt-3">
          <PixelButton
            type="button"
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={onRoll}
          >
            {busy ? "Resolving…" : "Roll the dice"}
          </PixelButton>
          <PixelButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onReplay}
          >
            Replay turn
          </PixelButton>
          <PixelButton
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume" : "Pause"}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function PreviewDie({ face }: { face: DieValue }) {
  const pips = PIP_LAYOUT[face];
  return (
    <div className="grid size-8 grid-cols-3 grid-rows-3 gap-[2px] border-[3px] border-void bg-cream p-[3px] shadow-pixel-sm sm:size-9">
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
  hot,
  style,
}: {
  tile: BoardTile;
  edge: TileEdge;
  hot?: boolean;
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
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden outline outline-1 outline-void",
        hot && "z-10 brightness-125 ring-2 ring-gold",
      )}
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
