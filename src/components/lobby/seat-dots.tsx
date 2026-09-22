import { LUDO_COLORS } from "@/lib/game/ludo-board";
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
  palette,
}: {
  filled: number;
  total: number;
  className?: string;
  palette?: "ludo";
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
              ? palette === "ludo"
                ? "border-void/40"
                : cn(
                    "border-void/40",
                    SEAT_COLORS[index % SEAT_COLORS.length].bg,
                  )
              : "border-edge-bright bg-transparent",
          )}
          style={
            index < filled && palette === "ludo"
              ? {
                  backgroundColor:
                    LUDO_COLORS[index % LUDO_COLORS.length].hex,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
