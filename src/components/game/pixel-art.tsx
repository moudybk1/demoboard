import {
  spritePixels,
  spriteSize,
  type PixelSprite,
} from "@/lib/game/pixel-sprite";
import { cn } from "@/lib/utils";

/**
 * Renders a {@link PixelSprite} as an SVG of 1x1 rects on a viewBox sized to
 * the sprite grid. `shapeRendering: crispEdges` keeps the pixel grid sharp at
 * every scale instead of blurring the edges.
 */
export function PixelArt({
  sprite,
  label,
  className,
}: {
  sprite: PixelSprite;
  /** Accessible name, or omit to treat the art as decorative. */
  label?: string;
  className?: string;
}) {
  const { width, height } = spriteSize(sprite);
  const pixels = spritePixels(sprite);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block h-auto w-full", className)}
      shapeRendering="crispEdges"
      data-pixel
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pixels.map((pixel) => (
        <rect
          key={`${pixel.x}-${pixel.y}`}
          x={pixel.x}
          y={pixel.y}
          width={1}
          height={1}
          fill={pixel.fill}
        />
      ))}
    </svg>
  );
}
