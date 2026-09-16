"use client";

import { useState } from "react";
import { Music2, Volume2 } from "lucide-react";

import {
  audioManager,
  playSfx,
  unlockAudio,
} from "@/lib/audio/audio-manager";
import { PixelLabel } from "@/components/ui/pixel-label";
import { cn } from "@/lib/utils";

/**
 * Compact SFX + music volume sliders with mute toggles.
 * Used on Settings and as a popover from the site header.
 */
export function AudioVolumeControls({ className }: { className?: string }) {
  const [sfxMuted, setSfxMuted] = useState(() => audioManager.isMuted());
  const [musicMuted, setMusicMuted] = useState(() =>
    audioManager.isMusicMuted(),
  );
  const [sfxVolume, setSfxVolume] = useState(() => audioManager.getVolume());
  const [musicVolume, setMusicVolume] = useState(() =>
    audioManager.getMusicVolume(),
  );

  return (
    <div className={cn("space-y-4", className)}>
      <VolumeControl
        icon={<Volume2 className="size-3.5" aria-hidden />}
        label="SFX"
        muted={sfxMuted}
        volume={sfxVolume}
        onToggleMute={() => {
          void unlockAudio();
          const next = audioManager.toggleMute();
          setSfxMuted(next);
          if (!next) playSfx("ui_click");
        }}
        onVolume={(value) => {
          void unlockAudio();
          audioManager.setVolume(value);
          setSfxVolume(value);
          if (audioManager.isMuted() && value > 0) {
            audioManager.setMuted(false);
            setSfxMuted(false);
          }
        }}
      />
      <VolumeControl
        icon={<Music2 className="size-3.5" aria-hidden />}
        label="Music"
        muted={musicMuted}
        volume={musicVolume}
        onToggleMute={() => {
          void unlockAudio();
          const next = audioManager.toggleMusicMute();
          setMusicMuted(next);
          if (!next) audioManager.startMusic();
        }}
        onVolume={(value) => {
          void unlockAudio();
          audioManager.setMusicVolume(value);
          setMusicVolume(value);
          if (audioManager.isMusicMuted() && value > 0) {
            audioManager.setMusicMuted(false);
            setMusicMuted(false);
            audioManager.startMusic();
          }
        }}
      />
    </div>
  );
}

function VolumeControl({
  icon,
  label,
  muted,
  volume,
  onToggleMute,
  onVolume,
}: {
  icon: React.ReactNode;
  label: string;
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolume: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <PixelLabel className="flex items-center gap-1.5 text-parchment">
          {icon}
          {label}
        </PixelLabel>
        <button
          type="button"
          onClick={onToggleMute}
          className={cn(
            "font-pixel text-xs uppercase",
            muted ? "text-danger" : "text-success",
          )}
        >
          {muted ? "Muted" : "On"}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(event) => onVolume(Number(event.target.value))}
          className="w-full accent-gold"
          aria-label={`${label} volume`}
        />
        <span className="w-8 text-right font-pixel text-xs text-faint">
          {muted ? 0 : Math.round(volume * 100)}
        </span>
      </div>
    </div>
  );
}
