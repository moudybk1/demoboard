import { cn } from "@/lib/utils";

type TerrainVariant = "skyline" | "dunes" | "ridge";

type PixelTerrainProps = {
  /** Tailwind color class that sets `currentColor` for the land fill. */
  className?: string;
  variant?: TerrainVariant;
  /** Sit on the top edge (next biome overlapping up) or the bottom. */
  edge?: "top" | "bottom";
  /**
   * `overlay` pins to a filled section. `stack` sits in flow with a
   * transparent sky so the previous biome shows through the ridge.
   */
  placed?: "overlay" | "stack";
};

/**
 * Pixel hill seam between landing biomes. Axie-style terrain joins, not a
 * flat rule. Fill comes from `currentColor` so each section picks its land.
 */
export function PixelTerrain({
  className,
  variant = "skyline",
  edge = "top",
  placed = "overlay",
}: PixelTerrainProps) {
  const d = PATHS[variant];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none z-[2] h-20 overflow-hidden sm:h-28",
        placed === "overlay" && "absolute inset-x-0",
        placed === "overlay" && (edge === "top" ? "top-0" : "bottom-0"),
        placed === "stack" && "relative w-full",
        className,
      )}
    >
      <svg
        viewBox="0 0 320 56"
        preserveAspectRatio="none"
        className="h-full w-full"
        shapeRendering="crispEdges"
        data-pixel
      >
        <path d={d.land} fill="currentColor" />
        <path d={d.shade} fill="currentColor" className="opacity-25" />
        <path d={d.ridge} fill="#2d170c" />
        {d.dither.map((rect) => (
          <rect
            key={`${rect.x}-${rect.y}`}
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            fill="#1a9f4b"
            opacity="0.45"
          />
        ))}
      </svg>
    </div>
  );
}

const PATHS: Record<
  TerrainVariant,
  {
    land: string;
    shade: string;
    ridge: string;
    dither: { x: number; y: number; w: number; h: number }[];
  }
> = {
  skyline: {
    land: "M0 56 V16 H20 V10 H44 V4 H68 V8 H92 V2 H124 V8 H156 V4 H188 V12 H220 V6 H252 V14 H284 V8 H320 V56 Z",
    shade:
      "M0 56 V36 H44 V32 H92 V28 H156 V30 H220 V34 H252 V38 H320 V56 Z",
    ridge:
      "M0 16 H20 V10 H44 V4 H68 V8 H92 V2 H124 V8 H156 V4 H188 V12 H220 V6 H252 V14 H284 V8 H320 V11 H284 V17 H252 V9 H220 V15 H188 V7 H156 V11 H124 V5 H92 V11 H68 V7 H44 V13 H20 V19 H0 Z",
    dither: [
      { x: 28, y: 30, w: 4, h: 4 },
      { x: 76, y: 26, w: 4, h: 4 },
      { x: 140, y: 24, w: 4, h: 4 },
      { x: 200, y: 30, w: 4, h: 4 },
      { x: 268, y: 32, w: 4, h: 4 },
    ],
  },
  dunes: {
    land: "M0 56 V22 H28 V14 H60 V24 H88 V10 H128 V18 H160 V12 H196 V20 H228 V16 H264 V26 H296 V18 H320 V56 Z",
    shade:
      "M0 56 V38 H60 V34 H128 V30 H196 V36 H264 V40 H320 V56 Z",
    ridge:
      "M0 22 H28 V14 H60 V24 H88 V10 H128 V18 H160 V12 H196 V20 H228 V16 H264 V26 H296 V18 H320 V21 H296 V29 H264 V19 H228 V23 H196 V15 H160 V21 H128 V13 H88 V27 H60 V17 H28 V25 H0 Z",
    dither: [
      { x: 16, y: 28, w: 4, h: 4 },
      { x: 100, y: 22, w: 4, h: 4 },
      { x: 172, y: 26, w: 4, h: 4 },
      { x: 240, y: 28, w: 4, h: 4 },
      { x: 304, y: 30, w: 4, h: 4 },
    ],
  },
  ridge: {
    land: "M0 56 V18 H36 V26 H64 V12 H104 V20 H140 V8 H176 V16 H208 V22 H248 V14 H280 V24 H320 V56 Z",
    shade:
      "M0 56 V36 H64 V32 H140 V28 H208 V34 H280 V38 H320 V56 Z",
    ridge:
      "M0 18 H36 V26 H64 V12 H104 V20 H140 V8 H176 V16 H208 V22 H248 V14 H280 V24 H320 V27 H280 V17 H248 V25 H208 V19 H176 V11 H140 V23 H104 V15 H64 V29 H36 V21 H0 Z",
    dither: [
      { x: 48, y: 32, w: 4, h: 4 },
      { x: 112, y: 26, w: 4, h: 4 },
      { x: 168, y: 22, w: 4, h: 4 },
      { x: 224, y: 30, w: 4, h: 4 },
      { x: 288, y: 32, w: 4, h: 4 },
    ],
  },
};
