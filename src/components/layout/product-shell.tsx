import { ClosedDemoStrip } from "@/components/demo/closed-demo-strip";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageReveal } from "@/components/layout/page-reveal";
import { PixelCard } from "@/components/ui/pixel-card";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { cn } from "@/lib/utils";

type ProductShellProps = {
  children: React.ReactNode;
  /** Optional accent wash for the felt stage. */
  accent?: "mint" | "monopoly" | "ludo" | "gold";
  className?: string;
  /** Wider default; use narrow for denser forms. */
  width?: "default" | "wide";
  /** Override or hide the top notice strip. */
  strip?: React.ReactNode | false;
  stripLabel?: string;
};

const ACCENT: Record<NonNullable<ProductShellProps["accent"]>, string> = {
  mint: "before:bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,color-mix(in_srgb,var(--color-gold)_20%,transparent),transparent_70%)]",
  monopoly:
    "before:bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,color-mix(in_srgb,var(--color-monopoly)_18%,transparent),transparent_70%)]",
  ludo: "before:bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,color-mix(in_srgb,var(--color-ludo)_16%,transparent),transparent_70%)]",
  gold: "before:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in_srgb,var(--color-gold)_22%,transparent),transparent_70%)]",
};

/**
 * Shared product page shell: pixel felt table + sticker stage + reveal.
 */
export function ProductShell({
  children,
  accent = "mint",
  className,
  width = "default",
  strip,
  stripLabel,
}: ProductShellProps) {
  return (
    <div className="board-atmosphere flex min-h-full flex-col">
      <SiteHeader />
      <main
        className={cn(
          "board-container flex-1 py-5 sm:py-8",
          width === "wide" && "max-w-[80rem]",
        )}
      >
        <PixelCard
          size="lg"
          tone="felt"
          className="w-full"
          faceClassName={cn(
            "relative isolate overflow-hidden p-3 sm:p-5 lg:p-6",
            "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:content-['']",
            ACCENT[accent],
            className,
          )}
        >
          <PageReveal className="relative z-[1] space-y-7 sm:space-y-9">
            {strip === false ? null : (
              <>
                {PLAY_IS_LIVE ? null : <ClosedDemoStrip />}
                {strip ??
                  (stripLabel ? (
                    <ClosedDemoStrip label={stripLabel} />
                  ) : null)}
              </>
            )}
            {children}
          </PageReveal>
        </PixelCard>
      </main>
      <SiteFooter />
    </div>
  );
}
