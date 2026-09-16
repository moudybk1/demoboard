"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { AudioVolumeControls } from "@/components/audio/audio-volume-controls";
import { unlockAudio } from "@/lib/audio/audio-manager";
import { cn } from "@/lib/utils";

/**
 * Header popover with SFX + music volume / mute controls.
 */
export function AudioControlsPopover({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Audio volume controls"
        aria-expanded={open}
        className="grid size-8 place-items-center pixel-corners border-[3px] border-void bg-cream text-muted shadow-pixel-sm transition-colors hover:bg-gold hover:text-void sm:size-9"
        onClick={() => {
          void unlockAudio();
          setOpen((value) => !value);
        }}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[50] w-56 pixel-corners border-[3px] border-void bg-surface p-3 shadow-pixel">
          <p className="mb-3 font-pixel text-xs font-bold uppercase text-faint">
            Audio mix
          </p>
          <AudioVolumeControls />
        </div>
      ) : null}
    </div>
  );
}
