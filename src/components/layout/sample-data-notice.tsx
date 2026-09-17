import { TriangleAlert } from "lucide-react";

import { PixelCard } from "@/components/ui/pixel-card";
import { PLAY_IS_LIVE, SAMPLE_DATA_NOTE } from "@/lib/platform-status";

/**
 * States plainly that the figures on this screen are not real.
 *
 * Renders nothing once staking is live. Sits above the content it describes,
 * because a reader who has already scrolled the table has formed an impression
 * the notice then has to undo.
 */
export function SampleDataNotice({ className }: { className?: string }) {
  if (PLAY_IS_LIVE) return null;

  return (
    <PixelCard
      role="note"
      data-reveal
      size="sm"
      tone="goldWash"
      stroke="gold"
      className={className}
      faceClassName="flex items-start gap-3 px-4 py-3"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
      <p className="text-xs leading-relaxed text-parchment">
        {SAMPLE_DATA_NOTE}
      </p>
    </PixelCard>
  );
}
