"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { audioManager, unlockAudio } from "@/lib/audio/audio-manager";
import { cn } from "@/lib/utils";

/**
 * Mute toggle for BOARD SFX. Unlocks AudioContext on first interaction.
 */
export function AudioMuteToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(audioManager.isMuted());
  }, []);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      aria-pressed={muted}
      className={cn(
        "grid size-8 place-items-center pixel-corners border-[3px] border-void bg-cream text-muted shadow-pixel-sm transition-colors hover:bg-gold hover:text-void sm:size-9",
        className,
      )}
      onClick={() => {
        void unlockAudio();
        setMuted(audioManager.toggleMute());
      }}
    >
      {muted ? (
        <VolumeX className="size-3.5" aria-hidden />
      ) : (
        <Volume2 className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
