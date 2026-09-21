import { boardColors } from "@/lib/design-system";
import type { PixelSprite } from "@/lib/game/pixel-sprite";

/**
 * Pixel trees for the play portal grove. Same sprite format as pawns so the
 * art stays on the BOARD grid instead of drifting into illustration.
 */

const TREE_PALETTE = {
  o: boardColors.void,
  l: "#3ee08a",
  f: boardColors.felt,
  d: "#1a9f4b",
  t: boardColors.goldDeep,
  b: "#8a3200",
} as const;

export const PLAY_TREE_TALL: PixelSprite = {
  palette: TREE_PALETTE,
  rows: [
    "....ooo....",
    "...olffo...",
    "..olffffo..",
    ".olffffffo.",
    ".olfdffffo.",
    "..olffffo..",
    "...olffo...",
    "....obo....",
    "....oto....",
    "....oto....",
    "....oto....",
    "...obtbo...",
  ],
};

export const PLAY_TREE_WIDE: PixelSprite = {
  palette: TREE_PALETTE,
  rows: [
    ".....ooo.....",
    "...oolllloo..",
    "..olffffffo..",
    ".olffffffffo.",
    ".olffddffffo.",
    "..olffffffo..",
    "...oolllloo..",
    ".....obo.....",
    ".....oto.....",
    ".....oto.....",
    "....obtbo....",
  ],
};

export const PLAY_SPARKLE: PixelSprite = {
  palette: {
    g: boardColors.gold,
    d: boardColors.goldDeep,
    c: boardColors.cream,
  },
  rows: [
    "..g..",
    "..g..",
    "ggcgg",
    "..g..",
    "..d..",
  ],
};

export const PLAY_TORCH: PixelSprite = {
  palette: {
    o: boardColors.void,
    w: "#8a3200",
    f: "#ff9a1f",
    y: boardColors.gold,
    c: boardColors.cream,
  },
  rows: [
    "...y...",
    "..ycf..",
    "..yffo.",
    "...fo..",
    "...wo..",
    "...wo..",
    "..owwo.",
  ],
};

export const PLAY_CHEST: PixelSprite = {
  palette: {
    o: boardColors.void,
    w: "#8a3200",
    d: "#5a1e00",
    g: boardColors.gold,
    y: "#ffe566",
  },
  rows: [
    "..oooooo..",
    ".owwwwwwo.",
    "owggggggwo",
    "odwwwwwwdo",
    "owyyyyyywo",
    "odwwwwwwdo",
    ".oooooooo.",
  ],
};
