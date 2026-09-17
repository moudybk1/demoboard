/**
 * Shared GSAP defaults so many board animations stay smooth together.
 * Import once from the root client shell (AudioUnlock / layout clients).
 */
import gsap from "gsap";

let configured = false;

export function configureBoardMotion() {
  if (configured || typeof window === "undefined") return;
  configured = true;

  gsap.config({
    nullTargetWarn: false,
    force3D: true,
  });

  gsap.ticker.lagSmoothing(500, 33);
  gsap.defaults({
    overwrite: "auto",
    force3D: true,
  });

  try {
    if (window.localStorage.getItem("board.display.reducedMotion") === "1") {
      document.documentElement.dataset.reducedMotion = "true";
    }
  } catch {
    // ignore blocked storage
  }

  // Pause the global ticker while the tab is hidden so stacked room
  // animations do not pile up catch-up work when the user returns.
  const onVisibility = () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  };
  document.addEventListener("visibilitychange", onVisibility);
}

/** Prefer skipping heavy loops when the tab is hidden. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  try {
    if (window.localStorage.getItem("board.display.reducedMotion") === "1") {
      return true;
    }
  } catch {
    // ignore blocked storage
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
