import Link from "next/link";

import { PixelTerrain } from "@/components/welcome/pixel-terrain";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { cn } from "@/lib/utils";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

/**
 * Site footer. One row, not four template columns: the product has two legal
 * pages and a status line, so that is what it links to.
 */
export function SiteFooter({
  className,
  seam = false,
}: {
  className?: string;
  /** Pixel hill join for the landing biomes. Inner pages keep a flat rule. */
  seam?: boolean;
}) {
  return (
    <footer
      className={cn(
        "relative pb-[env(safe-area-inset-bottom)]",
        seam ? "z-20 -mt-16 sm:-mt-20" : "border-t-[3px] border-void bg-ink/70",
        className,
      )}
    >
      {seam ? (
        <PixelTerrain placed="stack" variant="skyline" className="text-ink" />
      ) : null}
      <div className={cn(seam && "-mt-px bg-ink")}>
        <div className="board-container relative z-[1] flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-pixel text-xs font-semibold uppercase tracking-wider text-faint">
          {PLAY_IS_LIVE
            ? "BOARD · Robinhood Chain"
            : "BOARD · closed demo, staking not live"}
        </p>

        <nav aria-label="Legal" className="flex items-center gap-4">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-pixel text-xs font-semibold uppercase tracking-wider text-muted underline-offset-4 transition-colors hover:text-parchment hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        </div>
      </div>
    </footer>
  );
}
