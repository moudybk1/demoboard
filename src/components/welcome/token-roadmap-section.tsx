import { PixelCard } from "@/components/ui/pixel-card";
import { TOKEN_ECONOMY, type EconomyLane } from "@/lib/mock/token-roadmap";
import { cn } from "@/lib/utils";

/**
 * Token economy: gameplay + DEX fee cards on the hero sky atmosphere.
 */
export function TokenRoadmapSection({ className }: { className?: string }) {
  return (
    <section
      id="token"
      aria-labelledby="token-economy-title"
      className={cn(
        "relative z-20 scroll-mt-28 overflow-visible border-t-[3px] border-void bg-transparent pb-16 pt-12 sm:pb-20 sm:pt-14",
        className,
      )}
    >
      <div className="board-container relative">
        <header className="max-w-2xl">
          <p className="font-pixel text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {TOKEN_ECONOMY.eyebrow}
          </p>
          <h2
            id="token-economy-title"
            className="mt-3 font-pixel text-[clamp(1.6rem,2.8vw,2.35rem)] font-bold leading-snug tracking-tight text-parchment"
          >
            {TOKEN_ECONOMY.title}
          </h2>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted">
            {TOKEN_ECONOMY.lead}
          </p>
        </header>

        <div className="mt-10 grid gap-5 sm:gap-6 lg:mt-12 lg:grid-cols-2">
          {TOKEN_ECONOMY.lanes.map((lane) => (
            <EconomyLaneCard key={lane.id} lane={lane} />
          ))}
        </div>

        <p className="mt-10 max-w-[44ch] font-pixel text-sm font-semibold leading-snug text-parchment sm:mt-12 sm:text-base">
          {TOKEN_ECONOMY.closing}
        </p>
      </div>
    </section>
  );
}

function EconomyLaneCard({ lane }: { lane: EconomyLane }) {
  const accent = lane.id === "gameplay" ? "monopoly" : "gold";

  return (
    <PixelCard
      as="article"
      size="lg"
      tone="cream"
      stroke={accent === "monopoly" ? "monopoly" : "gold"}
      className="h-full"
      faceClassName="flex h-full flex-col overflow-hidden"
    >
      <div
        aria-hidden
        className={cn(
          "h-2 w-full",
          accent === "monopoly" ? "bg-monopoly" : "bg-gold-deep",
        )}
      />
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
        <h3 className="font-pixel text-base font-bold uppercase tracking-wider text-parchment sm:text-lg">
          {lane.title}
        </h3>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted sm:text-base">
          {lane.body}
        </p>

        <ul className="mt-5 space-y-2.5">
          {lane.splits.map((split) => (
            <li
              key={split.label}
              className="flex items-center justify-between gap-3 border-[3px] border-void bg-surface px-3.5 py-3"
            >
              <span className="font-pixel text-xs font-semibold uppercase tracking-wider text-parchment sm:text-sm">
                {split.label}
              </span>
              <span className="font-sans text-xl font-bold tabular-nums leading-none tracking-tight text-gold-deep sm:text-2xl">
                {split.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PixelCard>
  );
}
