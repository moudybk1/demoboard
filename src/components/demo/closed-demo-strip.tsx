import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Persistent strip above product pages. Pass `label` to override the default
 * closed-demo reminder.
 */
export function ClosedDemoStrip({
  className,
  label = "Closed demo · demo tables · no BOARD is staked or paid out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <PixelCard
      role="note"
      size="sm"
      tone="gold"
      className={className}
      faceClassName="px-3 py-2 font-pixel text-xs font-semibold uppercase leading-snug text-void"
    >
      {label}
    </PixelCard>
  );
}
