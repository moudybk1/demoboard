/**
 * Game SFX façade · delegates to the global BOARD audio manager so mute /
 * volume controls apply everywhere.
 */
import { playSfx } from "@/lib/audio/audio-manager";

/** Settings / one-shot preview of a dice tumble. */
export function playRollSound() {
  playSfx("dice_roll");
}

/** Bright chime when a pawn is captured ("eaten"). */
export function playCaptureSound() {
  playSfx("capture");
}

/** Token tap on each tile the pawn hops. */
export function playHopSound() {
  playSfx("pawn_step");
}

export function playWinSound() {
  playSfx("win");
}

export function playLoseSound() {
  playSfx("lose");
}
