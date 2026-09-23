import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Optional status strip above product pages.
 */
export function ClosedDemoStrip({
  className,
  label = "Tables are live · match pots settle in $USDG",
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
