import { PixelCard } from "@/components/ui/pixel-card";
import { PixelTerrain } from "@/components/welcome/pixel-terrain";
import { TokenCaPromo } from "@/components/welcome/token-ca-promo";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { ROADMAP, TOKEN_INFO, type RoadmapItem } from "@/lib/mock/token-roadmap";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

export function TokenRoadmapSection({
  className,
  tokenAddress,
  tokenExplorerUrl,
}: {
  className?: string;
  tokenAddress?: `0x${string}` | null;
  tokenExplorerUrl?: string | null;
}) {
  return (
    <section
      aria-labelledby="token-roadmap-title"
      className={cn("relative z-20 -mt-16 overflow-visible sm:-mt-20", className)}
    >
      <PixelTerrain placed="stack" variant="ridge" className="text-surface" />

      <div className="-mt-px bg-surface pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="board-container relative">
          <div className="relative lg:min-h-[22rem]">
          <PixelCard
            size="lg"
            tone="cream"
            className="lg:absolute lg:left-0 lg:top-4 lg:z-10 lg:max-w-sm lg:-rotate-1"
            faceClassName="p-6 sm:p-8"
          >
            <h2
              id="token-roadmap-title"
              className="font-pixel text-2xl font-bold leading-snug text-parchment sm:text-3xl"
            >
              {TOKEN_INFO.symbol} on {TOKEN_INFO.chain}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {TOKEN_INFO.role}
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {TOKEN_INFO.feeNote}
            </p>

            {tokenAddress !== undefined ? (
              <TokenCaPromo
                className="mt-6"
                compact
                address={tokenAddress}
                explorerUrl={tokenExplorerUrl ?? null}
                chainLabel={ROBINHOOD_CHAIN_LABEL}
              />
            ) : null}

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm font-bold uppercase tracking-wide">
              <div>
                <dt className="text-faint">Symbol</dt>
                <dd className="mt-1 text-lg text-gold-deep">{TOKEN_INFO.symbol}</dd>
              </div>
              <div>
                <dt className="text-faint">Network</dt>
                <dd className="mt-1 text-lg text-parchment">{TOKEN_INFO.chain}</dd>
              </div>
            </dl>
          </PixelCard>

          <ol className="mt-8 space-y-4 lg:ml-[min(42%,24rem)] lg:mt-0 lg:pt-16">
            {ROADMAP.map((item, index) => (
              <RoadmapRow
                key={item.id}
                item={item}
                shift={index === 1 ? "lg:translate-x-6" : index === 2 ? "lg:-translate-x-2" : ""}
              />
            ))}
          </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapRow({
  item,
  shift,
}: {
  item: RoadmapItem;
  shift: string;
}) {
  const statusLabel =
    item.status === "live"
      ? PLAY_IS_LIVE
        ? "Live"
        : "Demo"
      : item.status === "next"
        ? "Next"
        : "Later";
  const statusClass =
    item.status === "live"
      ? PLAY_IS_LIVE
        ? "text-success"
        : "text-gold-deep"
      : item.status === "next"
        ? "text-gold-deep"
        : "text-faint";

  return (
    <PixelCard
      as="li"
      size="sm"
      tone="cream"
      className={shift}
      faceClassName="px-4 py-4 sm:px-5"
    >
      <span className={cn("text-sm font-bold uppercase", statusClass)}>
        {statusLabel}
      </span>
      <h3 className="mt-1 text-base font-bold text-parchment sm:text-lg">
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
    </PixelCard>
  );
}
