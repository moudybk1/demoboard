import { SEAT_COLORS } from "@/lib/game/seats";
import { cn } from "@/lib/utils";

/**
 * Four squares showing which seats at the table are taken. Filled seats get a
 * player colour; empty ones stay as hollow outlines.
 */
export function SeatDots({
  filled,
  total,
  className,
}: {
  filled: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${filled} of ${total} seats taken`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-3 pixel-corners border-[2px]",
            index < filled
              ? cn(
                  "border-void/40",
                  SEAT_COLORS[index % SEAT_COLORS.length].bg,
                )
              : "border-edge-bright bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
