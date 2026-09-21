"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { useSignIn } from "@/components/account/sign-in-provider";
import { PixelArt } from "@/components/game/pixel-art";
import { PlayArena, PlaySign } from "@/components/play/play-arena";
import { PixelButton } from "@/components/ui/pixel-button";
import { PLAY_CHEST } from "@/lib/game/play-sprites";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";

export function PlayGate() {
  const { openSignIn } = useSignIn();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;
    const intro = gsap.timeline();
    const sign = node.querySelector<HTMLElement>("[data-play-sign]");
    const frame = node.querySelector<HTMLElement>("[data-play-frame]");
    if (sign) {
      intro.from(sign, {
        y: -16,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform",
      });
    }
    if (frame) {
      intro.from(
        frame,
        {
          y: 14,
          duration: 0.4,
          ease: "power3.out",
          clearProps: "transform",
        },
        "-=0.28",
      );
    }
    return () => {
      intro.kill();
    };
  }, []);

  return (
    <section
      ref={root}
      aria-label="Connect wallet to play"
      className="relative isolate flex min-h-[100dvh] flex-1 flex-col overflow-hidden"
    >
      <PlayArena accent="gold" />

      <div className="relative z-[1] flex min-h-[100dvh] flex-col items-center justify-end px-4 pb-[4.5rem] pt-16 sm:justify-center sm:pb-8 sm:pt-10">
        <PlaySign label="PLAY" />

        <div data-play-frame className="mt-3 w-full max-w-[22rem] sm:mt-4">
          <div className="pixel-card-shadow-lg">
            <div className="pixel-notch border-[4px] border-void bg-[#5a2408] p-[4px]">
              <div className="pixel-notch relative overflow-hidden bg-[#1a0c06]">
                <div className="relative flex aspect-[5/4] flex-col items-center justify-center gap-2 px-4 pt-5">
                  <span className="w-16 sm:w-20" aria-hidden>
                    <PixelArt sprite={PLAY_CHEST} />
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="w-9 sm:w-10">
                      <PixelArt sprite={pawnSprite(1)} />
                    </span>
                    <span className="w-8 sm:w-9">
                      <PixelArt sprite={pawnSprite(2)} />
                    </span>
                    <span className="w-8 sm:w-9">
                      <PixelArt sprite={pawnSprite(3)} />
                    </span>
                    <span className="w-8 sm:w-9">
                      <PixelArt sprite={pawnSprite(4)} />
                    </span>
                  </div>
                  <p className="max-w-[24ch] text-center font-pixel text-[10px] font-semibold uppercase leading-snug tracking-wide text-cream/80">
                    Connect a wallet to enter the lobby.
                  </p>
                </div>

                <div className="border-t-[3px] border-void bg-[#1a0c06]/80 px-3 py-3">
                  <PixelButton
                    type="button"
                    size="lg"
                    variant="primary"
                    className="w-full justify-center"
                    onClick={openSignIn}
                  >
                    Connect Wallet
                  </PixelButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
