"use client";

import { PixelArt } from "@/components/game/pixel-art";
import {
  PLAY_SPARKLE,
  PLAY_TORCH,
} from "@/lib/game/play-sprites";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { cn } from "@/lib/utils";

type ArenaAccent = "monopoly" | "ludo" | "gold";

export function PlayArena({ accent: _accent = "gold" }: { accent?: ArenaAccent }) {
  const crowd = [1, 2, 3, 4, 2, 1, 4, 3, 1, 3, 2, 4];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div
        className="absolute inset-x-0 top-0 h-[42%]"
        style={{
          background:
            "linear-gradient(#7ec8ff 0%, #b8e0ff 55%, #e8f4ff 100%)",
        }}
      />
      <span className="absolute left-[12%] top-[8%] size-16 rounded-full bg-cream/80" />
      <span className="absolute right-[18%] top-[12%] h-10 w-24 rounded-full bg-cream/70" />
      <span className="absolute left-[38%] top-[6%] h-8 w-20 rounded-full bg-cream/60" />

      <div
        className="absolute inset-x-0 bottom-0 h-[62%]"
        style={{
          background:
            "linear-gradient(#c7783a 0%, #d4893a 18%, #e0a05a 42%, #c9843c 100%)",
        }}
      />

      <div className="absolute inset-x-[6%] bottom-[34%] h-[28%] sm:inset-x-[10%]">
        <div
          className="absolute inset-0 border-x-[6px] border-t-[6px] border-void"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                #b85a32 0 14px,
                #9a4624 14px 16px,
                #c46838 16px 30px
              )
            `,
            clipPath: "polygon(8% 100%, 18% 0, 82% 0, 92% 100%)",
          }}
        />
        <div className="absolute inset-x-[16%] top-[18%] flex justify-between px-2">
          {crowd.slice(0, 6).map((seat, i) => (
            <span key={`top-${i}`} className="w-6 sm:w-7">
              <PixelArt sprite={pawnSprite(seat)} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-[10%] bottom-[8%] flex justify-between px-1">
          {crowd.slice(6).map((seat, i) => (
            <span key={`mid-${i}`} className="w-7 sm:w-8">
              <PixelArt sprite={pawnSprite(seat)} />
            </span>
          ))}
        </div>
      </div>

      <span className="absolute bottom-[22%] left-[8%] w-7 sm:left-[12%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[22%] right-[8%] w-7 sm:right-[12%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[18%] left-[22%] w-7 opacity-80">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[18%] right-[22%] w-7 opacity-80">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
    </div>
  );
}

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
      <PlaySparkle className="absolute -left-2 top-8" delay="0ms" />
      <PlaySparkle className="absolute -right-3 top-4" delay="400ms" />

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
  delay,
}: {
  className?: string;
  delay: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("w-4 animate-blink sm:w-5", className)}
      style={{ animationDelay: delay }}
    >
      <PixelArt sprite={PLAY_SPARKLE} />
    </span>
  );
}
