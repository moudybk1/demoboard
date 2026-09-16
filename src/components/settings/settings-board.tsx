"use client";

import { useEffect, useState } from "react";
import { Dice5, Monitor, Volume2 } from "lucide-react";

import { AudioVolumeControls } from "@/components/audio/audio-volume-controls";
import { audioManager, playSfx, unlockAudio } from "@/lib/audio/audio-manager";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelSwitch } from "@/components/ui/pixel-switch";
import {
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui/pixel-panel";
import { cn } from "@/lib/utils";

const STORAGE_REDUCED = "board.display.reducedMotion";
const STORAGE_SCANLINES = "board.display.scanlines";

function readLocalFlag(key: string, whenMissing: boolean): boolean {
  if (typeof window === "undefined") return whenMissing;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return whenMissing;
    return raw === "1";
  } catch {
    return whenMissing;
  }
}

/**
 * Display + sound controls used on `/settings`. Persists to localStorage.
 */
export function SettingsBoard({ className }: { className?: string }) {
  const [musicAutoplay, setMusicAutoplay] = useState(() =>
    audioManager.getMusicAutoplay(),
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    readLocalFlag(STORAGE_REDUCED, false),
  );
  const [scanlines, setScanlines] = useState(() =>
    readLocalFlag(STORAGE_SCANLINES, true),
  );

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion
      ? "true"
      : "false";
    document.documentElement.dataset.scanlines = scanlines ? "on" : "off";
    try {
      window.localStorage.setItem(STORAGE_REDUCED, reducedMotion ? "1" : "0");
      window.localStorage.setItem(STORAGE_SCANLINES, scanlines ? "1" : "0");
    } catch {
      // ignore
    }
  }, [reducedMotion, scanlines]);

  return (
    <div className={cn("grid gap-5 lg:grid-cols-2 lg:gap-6", className)}>
      <PixelPanel tone="raised" className="overflow-hidden">
        <PixelPanelHeader className="bg-gold/30">
          <div className="flex items-center gap-2">
            <Monitor className="size-3.5 text-gold-deep" aria-hidden />
            <PixelPanelTitle>Display</PixelPanelTitle>
          </div>
        </PixelPanelHeader>
        <div className="space-y-6 p-5 sm:p-6">
          <PixelSwitch
            label="Reduce motion"
            description="Softens hops, dice tumbles, and idle bobbing."
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
          <div className="h-px bg-edge" aria-hidden />
          <PixelSwitch
            label="Confetti dots"
            description="Tiny candy dots sprinkled across the playground."
            checked={scanlines}
            onChange={setScanlines}
          />
          <p className="pixel-corners border-[3px] border-void bg-cream px-3 py-3 text-sm leading-relaxed text-muted">
            Every line uses Pixelify Sans — a pixel face sized so labels,
            buttons, and body copy stay easy to read.
          </p>
        </div>
      </PixelPanel>

      <PixelPanel tone="gold" className="overflow-hidden">
        <PixelPanelHeader className="bg-gold/40">
          <div className="flex items-center gap-2">
            <Volume2 className="size-3.5 text-gold-deep" aria-hidden />
            <PixelPanelTitle>Sound</PixelPanelTitle>
          </div>
        </PixelPanelHeader>
        <div className="space-y-6 p-5 sm:p-6">
          <AudioVolumeControls />
          <div className="h-px bg-gold/20" aria-hidden />
          <PixelSwitch
            label="Music autoplay"
            description="Start the loop automatically after unlock."
            checked={musicAutoplay}
            onChange={(on) => {
              void unlockAudio();
              audioManager.setMusicAutoplay(on);
              setMusicAutoplay(on);
            }}
          />
          <PixelButton
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-center sm:w-auto"
            onClick={() => {
              void unlockAudio();
              playSfx("dice_roll");
            }}
          >
            <Dice5 className="size-3.5" aria-hidden />
            Test dice SFX
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
