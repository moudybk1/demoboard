"use client";

import { memo } from "react";

import { PixelArt } from "@/components/game/pixel-art";
import {
  PLAY_CHEST,
  PLAY_SPARKLE,
  PLAY_TORCH,
  PLAY_TREE_TALL,
  PLAY_TREE_WIDE,
} from "@/lib/game/play-sprites";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { cn } from "@/lib/utils";

type ArenaAccent = "monopoly" | "ludo" | "gold";

const HORIZON: Record<ArenaAccent, string> = {
  gold: "#ffd23a",
  monopoly: "#1298c9",
  ludo: "#e83f86",
};

const WALKERS = [
  { seat: 1, delay: "0s", duration: "26s", hop: "0s" },
  { seat: 2, delay: "-7s", duration: "30s", hop: "0.12s" },
  { seat: 3, delay: "-14s", duration: "24s", hop: "0.05s" },
  { seat: 4, delay: "-20s", duration: "32s", hop: "0.2s" },
] as const;

/** Decorative lobby backdrop. Memoized — never depends on live table state. */
export const PlayArena = memo(function PlayArena({
  accent = "gold",
}: {
  accent?: ArenaAccent;
}) {
  return (
    <div
      aria-hidden
      data-accent={accent}
      className="play-world pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-[46%]"
        style={{
          background:
            "linear-gradient(#6eb8f5 0%, #9ed4ff 42%, #d7eeff 78%, #f3e2c4 100%)",
        }}
      />

      <PixelSun className="left-[7%] top-[7%] sm:left-[10%]" />
      <PixelCloud className="left-[22%] top-[9%] w-16 sm:w-20" />
      <PixelCloud className="play-cloud-b right-[16%] top-[6%] w-24 sm:w-28" />
      <PixelCloud className="play-cloud-c left-[48%] top-[14%] hidden w-14 sm:block" />

      <PixelBird className="left-[18%] top-[16%]" />
      <PixelBird
        className="left-[40%] top-[11%] hidden sm:block"
        delay="-11s"
      />

      <div
        className="play-horizon absolute inset-x-0 top-[43%] h-[5px]"
        style={{ backgroundColor: HORIZON[accent] }}
      />

      <PixelDunes />

      <div
        className="absolute inset-x-0 bottom-0 h-[58%]"
        style={{
          background:
            "linear-gradient(#d7a15a 0%, #e0a85c 22%, #c9843c 70%, #b56d32 100%)",
        }}
      />
      <div
        className="absolute inset-x-[18%] bottom-0 h-[22%] sm:inset-x-[28%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, #c9843c 0 18px, #b56d32 18px 22px)",
        }}
      />

      <PixelHall accent={accent} />

      <span className="play-sway absolute bottom-[16%] left-[3%] w-10 sm:left-[6%] sm:w-14">
        <PixelArt sprite={PLAY_TREE_TALL} />
      </span>
      <span className="play-sway play-sway-late absolute bottom-[13%] left-[11%] hidden w-12 sm:block">
        <PixelArt sprite={PLAY_TREE_WIDE} />
      </span>
      <span className="play-sway play-sway-late absolute bottom-[16%] right-[3%] w-10 sm:right-[6%] sm:w-14">
        <PixelArt sprite={PLAY_TREE_TALL} />
      </span>
      <span className="play-sway absolute bottom-[13%] right-[11%] hidden w-12 sm:block">
        <PixelArt sprite={PLAY_TREE_WIDE} />
      </span>

      <span className="play-flame absolute bottom-[20%] left-[7%] w-7 sm:left-[14%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="play-flame absolute bottom-[20%] right-[7%] w-7 sm:right-[14%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[18%] left-[18%] hidden w-9 sm:block">
        <PixelArt sprite={PLAY_CHEST} />
      </span>

      <div className="absolute inset-x-0 bottom-[4%] h-12 sm:bottom-[6%]">
        {WALKERS.map((walker) => (
          <span
            key={walker.seat}
            className="play-walker absolute bottom-0 left-0 w-7 sm:w-8"
            style={{
              animationDelay: walker.delay,
              animationDuration: walker.duration,
            }}
          >
            <span
              className="play-hop block w-full"
              style={{ animationDelay: walker.hop }}
            >
              <PixelArt sprite={pawnSprite(walker.seat)} />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});

export function PlaySign({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      data-play-sign
      className={cn(
        "relative w-full",
        compact ? "max-w-[14rem] sm:max-w-[16rem]" : "max-w-[18rem] sm:max-w-[22rem]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-[28%] top-0 w-[5px] bg-void",
          compact ? "h-5 sm:h-6" : "h-7 sm:h-8",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute right-[28%] top-0 w-[5px] bg-void",
          compact ? "h-5 sm:h-6" : "h-7 sm:h-8",
        )}
      />
      <PlaySparkle className="absolute -left-2 top-8" />
      <PlaySparkle className="absolute -right-3 top-4" />

      <div
        className={cn(
          "relative mx-auto w-full",
          compact ? "mt-5 sm:mt-6" : "mt-7 sm:mt-8",
        )}
      >
        <div className="pixel-card-shadow-lg">
          <div className="pixel-notch border-[4px] border-void bg-[#8a3200] p-[3px]">
            <div
              className={cn(
                "pixel-notch relative overflow-hidden",
                compact ? "px-3 py-2 sm:px-4" : "px-4 py-2.5 sm:px-5 sm:py-3",
              )}
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    90deg,
                    #e39a3a 0 12px,
                    #d4892a 12px 14px,
                    #c77822 14px 26px
                  )
                `,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-cream/35"
              />
              <h1
                className="text-center font-pixel font-bold leading-none tracking-wide text-gold"
                style={{
                  fontSize: compact
                    ? "clamp(1.5rem, 6vw, 2.2rem)"
                    : label.length > 6
                      ? "clamp(1.7rem, 7vw, 2.7rem)"
                      : "clamp(2.2rem, 9vw, 3.4rem)",
                  textShadow: "3px 3px 0 #c45a00, 5px 5px 0 #1a0c06",
                }}
              >
                {label}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlaySparkle({
  className,
}: {
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("play-spark w-4 sm:w-5", className)}>
      <PixelArt sprite={PLAY_SPARKLE} />
    </span>
  );
}

function PixelSun({ className }: { className?: string }) {
  return (
    <span className={cn("play-sun absolute block size-8 bg-[#ffd23a] sm:size-10", className)}>
      <span className="absolute -left-2 top-2 h-4 w-2 bg-[#ffd23a] sm:top-3" />
      <span className="absolute -right-2 top-2 h-4 w-2 bg-[#ffd23a] sm:top-3" />
      <span className="absolute left-2 -top-2 h-2 w-4 bg-[#ffe566]" />
      <span className="absolute left-2 -bottom-2 h-2 w-4 bg-[#ffe566]" />
      <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 bg-[#fff8e4]" />
    </span>
  );
}

function PixelCloud({ className }: { className?: string }) {
  return (
    <span className={cn("play-cloud absolute block h-7", className)}>
      <span className="absolute left-[18%] top-0 h-2 w-[46%] bg-[#fff8e4]" />
      <span className="absolute inset-x-0 top-2 h-3 bg-[#fff8e4]" />
      <span className="absolute bottom-0 left-[8%] h-2 w-[72%] bg-[#ffe7a8]" />
    </span>
  );
}

function PixelBird({
  className,
  delay,
}: {
  className?: string;
  delay?: string;
}) {
  return (
    <span
      className={cn("play-bird absolute block h-3 w-6", className)}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <span className="absolute top-0 left-0 size-1.5 bg-[#2d170c]" />
      <span className="absolute top-1.5 left-1.5 size-1.5 bg-[#2d170c]" />
      <span className="absolute top-1.5 right-1.5 size-1.5 bg-[#2d170c]" />
      <span className="absolute top-0 right-0 size-1.5 bg-[#2d170c]" />
    </span>
  );
}

function PixelDunes() {
  return (
    <div className="absolute inset-x-0 top-[31%] h-24 sm:h-28">
      <div className="absolute bottom-2 left-[2%] flex items-end">
        <span className="h-4 w-6 bg-[#e7b56e]" />
        <span className="h-8 w-5 bg-[#fff1d0]" />
        <span className="h-12 w-4 border-x-2 border-void bg-[#fff6e0]" />
        <span className="h-7 w-6 bg-[#f3d0a0]" />
        <span className="h-3 w-8 bg-[#e7b56e]" />
      </div>
      <div className="absolute right-[2%] bottom-2 flex items-end">
        <span className="h-3 w-8 bg-[#e7b56e]" />
        <span className="h-9 w-5 bg-[#f6d7ad]" />
        <span className="h-14 w-4 border-x-2 border-void bg-[#fff6e0]" />
        <span className="h-6 w-6 bg-[#efc48a]" />
        <span className="h-3 w-5 bg-[#e7b56e]" />
      </div>
    </div>
  );
}

function PixelHall({ accent }: { accent: ArenaAccent }) {
  const banner = accent === "ludo" ? "bg-ludo" : accent === "monopoly" ? "bg-monopoly" : "bg-gold";

  return (
    <div className="absolute bottom-[40%] left-1/2 h-[22%] w-[min(28rem,92%)] -translate-x-1/2">
      <span className="absolute -top-1 left-[6%] h-11 w-1 bg-void">
        <span className={cn("play-flag absolute top-1 left-1 h-4 w-8 border-2 border-void", banner)} />
      </span>
      <span className="absolute -top-1 right-[6%] h-11 w-1 bg-void">
        <span
          className="play-flag absolute top-1 right-1 h-4 w-8 border-2 border-void bg-[#ff7a59]"
          style={{ transformOrigin: "100% 40%" }}
        />
      </span>

      <div
        className="absolute inset-x-[8%] top-6 bottom-0 border-x-[5px] border-t-[5px] border-void"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              180deg,
              #e39a3a 0 8px,
              #c46838 8px 10px,
              #b85a32 10px 18px
            )
          `,
          clipPath: "polygon(0 100%, 10% 0, 90% 0, 100% 100%)",
        }}
      />
    </div>
  );
}
