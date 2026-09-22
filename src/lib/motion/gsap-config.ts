/**
 * Shared GSAP defaults so many board animations stay smooth together.
 * Import once from the root client shell (AudioUnlock / layout clients).
 */
import gsap from "gsap";

let configured = false;

export function configureBoardMotion() {
  if (typeof window === "undefined") return;

  gsap.config({
    nullTargetWarn: false,
  });
  gsap.defaults({
    overwrite: "auto",
  });

  if (configured) return;
  configured = true;

  gsap.ticker.lagSmoothing(500, 33);

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
    if (document.hidden) {
      document.documentElement.dataset.tabHidden = "1";
      gsap.globalTimeline.pause();
    } else {
      delete document.documentElement.dataset.tabHidden;
      gsap.globalTimeline.resume();
    }
  };
  onVisibility();
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
