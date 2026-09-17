import { PixelCard } from "@/components/ui/pixel-card";

/**
 * Persistent reminder that playable screens are a closed preview, not live
 * staking. ProductShell and room pages mount this above sample tables.
 */
export function ClosedDemoStrip({ className }: { className?: string }) {
  return (
    <PixelCard
      role="note"
      size="sm"
      tone="gold"
      className={className}
      faceClassName="px-3 py-2 font-pixel text-xs font-semibold uppercase leading-snug text-void"
    >
      Closed demo · sample tables · no BOARD is staked or paid out
    </PixelCard>
  );
}
