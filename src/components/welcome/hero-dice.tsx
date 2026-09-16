"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { PIP_LAYOUT, randomDie, type DieValue } from "@/lib/game/dice";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import { cn } from "@/lib/utils";

/**
 * Hero dice pair: shake → toss → tumble → slap-land → celebrate.
 * Built for the landing felt, not the in-room tray.
 */
export function HeroDice({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [faces, setFaces] = useState<readonly [DieValue, DieValue]>([5, 3]);
  const [total, setTotal] = useState<number | null>(5 + 3);
  const [tag, setTag] = useState<string | null>(null);
  const facesRef = useRef(faces);

  useEffect(() => {
    facesRef.current = faces;
  }, [faces]);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;

    const dieA = node.querySelector<HTMLElement>("[data-die='a']");
    const dieB = node.querySelector<HTMLElement>("[data-die='b']");
    const shadowA = node.querySelector<HTMLElement>("[data-shadow='a']");
    const shadowB = node.querySelector<HTMLElement>("[data-shadow='b']");
    const callout = node.querySelector<HTMLElement>("[data-callout]");
    if (!dieA || !dieB) return;

    let cancelled = false;
    const flickers: number[] = [];
    const master = gsap.timeline({ repeat: -1, repeatDelay: 0.85 });

    const clearFlickers = () => {
      flickers.forEach((id) => window.clearInterval(id));
      flickers.length = 0;
    };

    const startFlicker = () => {
      clearFlickers();
      const id = window.setInterval(() => {
        setFaces([randomDie(), randomDie()]);
      }, 55);
      flickers.push(id);
    };

    const settleFaces = () => {
      clearFlickers();
      const next: [DieValue, DieValue] = [randomDie(), randomDie()];
      setFaces(next);
      setTotal(next[0] + next[1]);
      const funny =
        next[0] === next[1]
          ? "DOUBLES!"
          : next[0] + next[1] === 12
            ? "BOXCARS!"
            : next[0] + next[1] === 2
              ? "SNAKE EYES!"
              : next[0] + next[1] === 7
                ? "LUCKY 7"
                : null;
      setTag(funny);
      node.dispatchEvent(
        new CustomEvent("hero-dice-settle", {
          bubbles: true,
          detail: { total: next[0] + next[1], dice: next, isDouble: next[0] === next[1] },
        }),
      );
      return next;
    };

    // --- Idle tease ---
    master.add(() => {
      setTag(null);
      setTotal(facesRef.current[0] + facesRef.current[1]);
    });
    master.to([dieA, dieB], {
      rotation: (i) => (i === 0 ? -8 : 9),
      y: -4,
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
      stagger: 0.05,
    });

    // --- Wind-up shake ---
    master.to([dieA, dieB], {
      x: (i) => (i === 0 ? -10 : 10),
      rotation: (i) => (i === 0 ? -18 : 20),
      duration: 0.05,
      yoyo: true,
      repeat: 9,
      ease: "none",
      stagger: 0.02,
    });

    // --- Toss into the air ---
    master.add(() => {
      startFlicker();
      setTotal(null);
      setTag(null);
    });
    master
      .to(
        [dieA, dieB],
        {
          y: (i) => (i === 0 ? -150 : -175),
          x: (i) => (i === 0 ? -42 : 48),
          rotation: (i) => (i === 0 ? "+=520" : "-=600"),
          scale: 1.18,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.07,
        },
        "toss",
      )
      .to(
        [shadowA, shadowB],
        {
          scale: 0.3,
          opacity: 0.2,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.07,
        },
        "toss",
      );

    // Mid-air tumble
    master.to([dieA, dieB], {
      y: (i) => (i === 0 ? -88 : -108),
      rotation: (i) => (i === 0 ? "+=200" : "-=240"),
      duration: 0.32,
      ease: "sine.inOut",
      stagger: 0.05,
    });

    // --- Slap land with squash ---
    master.add(() => {
      settleFaces();
    });
    master
      .to(
        [dieA, dieB],
        {
          y: 0,
          x: 0,
          rotation: (i) => (i === 0 ? -8 : 10),
          scaleX: 1.22,
          scaleY: 0.72,
          duration: 0.28,
          ease: "power3.in",
          stagger: 0.07,
        },
        "land",
      )
      .to(
        [shadowA, shadowB],
        {
          scale: 1.15,
          opacity: 0.55,
          duration: 0.28,
          ease: "power3.in",
          stagger: 0.07,
        },
        "land",
      );

    // Bounce recovery + wobble
    master
      .to([dieA, dieB], {
        scaleX: 0.88,
        scaleY: 1.18,
        y: -28,
        rotation: 0,
        duration: 0.18,
        ease: "power2.out",
        stagger: 0.06,
      })
      .to([dieA, dieB], {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        duration: 0.28,
        ease: "bounce.out",
        stagger: 0.06,
      })
      .to(
        [shadowA, shadowB],
        {
          scale: 1,
          opacity: 0.45,
          duration: 0.28,
          stagger: 0.06,
        },
        "<",
      );

    // Callout pop
    master.fromTo(
      callout,
      { scale: 0.4, opacity: 0, y: 8 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.28,
        ease: "back.out(2.4)",
      },
      "-=0.1",
    );

    // Doubles victory spin (or cheeky nudge)
    master.add(() => {
      const [a, b] = facesRef.current;
      if (a === b && dieA && dieB) {
        gsap.to([dieA, dieB], {
          rotation: "+=360",
          duration: 0.55,
          ease: "power2.inOut",
          stagger: 0.08,
        });
      } else {
        gsap.to(dieA, { x: 6, duration: 0.1, yoyo: true, repeat: 1 });
        gsap.to(dieB, { x: -6, duration: 0.1, yoyo: true, repeat: 1, delay: 0.05 });
      }
    });

    master.to({}, { duration: 1.35 });

    master.to(callout, {
      opacity: 0,
      y: -6,
      duration: 0.25,
      ease: "power1.in",
    });

    return () => {
      cancelled = true;
      clearFlickers();
      master.kill();
      gsap.killTweensOf([dieA, dieB, shadowA, shadowB, callout]);
      void cancelled;
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn(
        "relative flex flex-col items-center gap-4 sm:gap-5",
        className,
      )}
    >
      <div className="relative flex items-end gap-6 pt-28 sm:gap-8 sm:pt-32 lg:gap-10 lg:pt-36">
        <HeroDieFace face={faces[0]} which="a" />
        <HeroDieFace face={faces[1]} which="b" />
      </div>

      <div
        data-callout
        className="flex min-h-14 flex-col items-center justify-center opacity-0"
      >
        {total !== null && (
          <p className="font-pixel text-2xl text-gold text-shadow-pixel sm:text-3xl lg:text-4xl">
            {total}
          </p>
        )}
        {tag && (
          <p className="mt-2 font-pixel text-xs font-semibold uppercase tracking-wider text-parchment sm:text-[10px]">
            {tag}
          </p>
        )}
      </div>
    </div>
  );
}

function HeroDieFace({
  face,
  which,
}: {
  face: DieValue;
  which: "a" | "b";
}) {
  const pips = PIP_LAYOUT[face];

  return (
    <div className="relative">
      <div
        data-shadow={which}
        className="absolute -bottom-3 left-1/2 h-3 w-[78%] -translate-x-1/2 bg-void/60 sm:-bottom-4 sm:h-4"
      />
      <div
        data-die={which}
        className="relative grid size-32 grid-cols-3 grid-rows-3 gap-2 pixel-corners border-[5px] border-void bg-cream p-2.5 shadow-pixel-lg sm:size-40 sm:gap-2.5 sm:border-[6px] sm:p-3 lg:size-52 lg:gap-3 lg:border-[7px] lg:p-3.5"
        style={{ transformOrigin: "50% 85%" }}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-white/40" />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-white/25" />
        {Array.from({ length: 9 }, (_, cell) => (
          <span
            key={cell}
            className={cn(
              pips.includes(cell) ? "bg-void pixel-corners" : "bg-transparent",
            )}
          />
        ))}
      </div>
    </div>
  );
}
