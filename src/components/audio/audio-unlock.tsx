"use client";

import { useEffect } from "react";

import { audioManager, playSfx, unlockAudio } from "@/lib/audio/audio-manager";
import { configureBoardMotion } from "@/lib/motion/gsap-config";

/**
 * Unlocks Web Audio on the first pointer / key gesture anywhere in the app,
 * then starts BGM when autoplay is enabled. Also warms GSAP defaults once.
 */
export function AudioUnlock() {
  useEffect(() => {
    configureBoardMotion();

    const unlock = () => {
      void unlockAudio().then(() => {
        if (
          audioManager.getMusicAutoplay() &&
          !audioManager.isMusicMuted()
        ) {
          audioManager.startMusic();
        }
      });
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    function onClick(event: MouseEvent) {
      const raw = event.target;
      const el =
        raw instanceof Element
          ? raw
          : raw instanceof Node
            ? raw.parentElement
            : null;
      if (!el) return;
      const hit = el.closest(
        "button, a[href], [role='button'], [role='menuitem'], [role='radio'], [role='tab'], summary",
      );
      if (!(hit instanceof HTMLElement)) return;
      if (hit.hasAttribute("data-click-sfx")) return;
      if (hit.getAttribute("aria-disabled") === "true") return;
      if ("disabled" in hit && Boolean((hit as HTMLButtonElement).disabled)) {
        return;
      }
      void unlockAudio();
      playSfx("ui_click");
    }
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
