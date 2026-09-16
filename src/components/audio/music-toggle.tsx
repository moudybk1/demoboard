"use client";

import { useEffect, useState } from "react";
import { Music2, Music } from "lucide-react";

import { audioManager, unlockAudio } from "@/lib/audio/audio-manager";
import { cn } from "@/lib/utils";

/**
 * Toggle background music. Autoplay begins after the first user gesture
 * (see AudioUnlock) when music is enabled.
 */
export function MusicToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(audioManager.isMusicMuted());
  }, []);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute music" : "Mute music"}
      aria-pressed={muted}
      className={cn(
        "grid size-8 place-items-center pixel-corners border-[3px] border-void bg-cream text-muted shadow-pixel-sm transition-colors hover:bg-gold hover:text-void sm:size-9",
        className,
      )}
      onClick={() => {
        void unlockAudio();
        const next = audioManager.toggleMusicMute();
        setMuted(next);
        if (!next) audioManager.startMusic();
      }}
    >
      {muted ? (
        <Music className="size-3.5 opacity-40" aria-hidden />
      ) : (
        <Music2 className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
