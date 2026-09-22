import { ConnectWalletButton } from "@/components/layout/connect-wallet-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelHeading } from "@/components/ui/pixel-label";
import {
  FEE_EXAMPLE,
  PRIZE_CLOSING,
  PRIZE_CTAS,
  PRIZE_DEX_FEES,
  PRIZE_ECOSYSTEM,
  PRIZE_RULES,
  PRIZE_RULES_INTRO,
  type PrizeBlock,
} from "@/lib/mock/prize-rules";
import { cn, formatBoard } from "@/lib/utils";

/**
 * Prize and fee guide: rules, example room, DEX fees, closing CTA.
 */
export function PrizeRulesContent({ className }: { className?: string }) {
  const ex = FEE_EXAMPLE;

  return (
    <article
      className={cn(
        "text-base leading-[1.65] text-parchment sm:text-lg",
        className,
      )}
    >
      <header className="border-b-[3px] border-void pb-8">
        <PixelHeading as="h1" size="lg">
          {PRIZE_RULES_INTRO.title}
        </PixelHeading>
        <p className="mt-3 max-w-[40rem] font-pixel text-sm font-semibold leading-snug text-gold-deep sm:text-base">
          {PRIZE_RULES_INTRO.punch}
        </p>
        <p className="mt-4 max-w-[42rem] text-base leading-[1.65] text-muted sm:text-lg">
          {PRIZE_RULES_INTRO.support}
        </p>
      </header>

      <ol className="mt-8 space-y-8">
        {PRIZE_RULES.map((rule, index) => (
          <li
            key={rule.id}
            className="border-l-[4px] border-gold-deep pl-4 sm:pl-5"
          >
            <p className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep">
              Rule {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-pixel text-lg font-bold leading-snug text-parchment sm:text-xl">
              {rule.title}
            </h2>
            <div className="mt-3 max-w-[42rem] space-y-3">
              {rule.answer.map((block, blockIndex) => (
                <PrizeBlockView
                  key={`${rule.id}-${blockIndex}`}
                  block={block}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <PixelCard
        as="aside"
        aria-labelledby="fee-example-title"
        tone="goldWash"
        size="lg"
        stroke="gold"
        className="mt-10"
        faceClassName="p-5 sm:p-7"
      >
        <h2
          id="fee-example-title"
          className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep"
        >
          Example room
        </h2>
        <p className="mt-3 text-base leading-[1.65] text-parchment sm:text-lg">
          {formatBoard(ex.entryFee)} $BOARD entry · {ex.seats} players
        </p>

        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Gross match pool
            </dt>
            <dd className="mt-2 font-sans text-2xl font-bold tabular-nums leading-none text-parchment">
              {formatBoard(ex.grossPot)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                $BOARD
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Protocol fee · {ex.feePercent}%
            </dt>
            <dd className="mt-2 font-sans text-2xl font-bold tabular-nums leading-none text-danger">
              {formatBoard(ex.feeAmount)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                $BOARD
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Winner receives
            </dt>
            <dd className="mt-2 font-sans text-2xl font-bold tabular-nums leading-none text-success">
              {formatBoard(ex.winnerPayout)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                $BOARD
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t-[3px] border-void pt-6">
          <h3 className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep">
            Where the {formatBoard(ex.feeAmount)} $BOARD fee goes
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="border-[3px] border-void bg-cream px-3 py-3">
              <p className="font-sans text-xl font-bold tabular-nums text-gold-deep">
                {formatBoard(ex.feeSplit.development)} $BOARD
              </p>
              <p className="mt-1 font-pixel text-xs font-semibold uppercase tracking-wider text-parchment">
                Development
              </p>
              <p className="mt-1 text-sm text-muted">30% of the protocol fee.</p>
            </li>
            <li className="border-[3px] border-void bg-cream px-3 py-3">
              <p className="font-sans text-xl font-bold tabular-nums text-gold-deep">
                {formatBoard(ex.feeSplit.buybackAndBurn)} $BOARD
              </p>
              <p className="mt-1 font-pixel text-xs font-semibold uppercase tracking-wider text-parchment">
                Buyback and Burn
              </p>
              <p className="mt-1 text-sm text-muted">70% of the protocol fee.</p>
            </li>
          </ul>
        </div>
      </PixelCard>

      <PixelCard
        as="section"
        aria-labelledby="dex-fee-title"
        tone="cream"
        size="lg"
        className="mt-8"
        faceClassName="p-5 sm:p-7"
      >
        <h2
          id="dex-fee-title"
          className="font-pixel text-xl font-bold text-parchment sm:text-2xl"
        >
          {PRIZE_DEX_FEES.title}
        </h2>
        <p className="mt-2 font-pixel text-sm font-semibold text-gold-deep sm:text-base">
          {PRIZE_DEX_FEES.punch}
        </p>
        <p className="mt-3 max-w-[42rem] text-base leading-[1.65] text-muted sm:text-lg">
          {PRIZE_DEX_FEES.lead}
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {PRIZE_DEX_FEES.splits.map((split) => (
            <li
              key={split.label}
              className="border-[3px] border-void bg-surface px-4 py-4"
            >
              <p className="font-sans text-2xl font-bold tabular-nums text-gold-deep">
                {split.percent}%
              </p>
              <p className="mt-2 font-pixel text-xs font-semibold uppercase tracking-wider text-parchment">
                {split.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {split.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 font-pixel text-sm font-semibold text-gold-deep sm:text-base">
          {PRIZE_DEX_FEES.formula}
        </p>
      </PixelCard>

      <section
        aria-labelledby="ecosystem-title"
        className="mt-10 border-t-[3px] border-void pt-8"
      >
        <h2
          id="ecosystem-title"
          className="font-pixel text-xl font-bold text-parchment sm:text-2xl"
        >
          {PRIZE_ECOSYSTEM.title}
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {PRIZE_ECOSYSTEM.streams.map((stream) => (
            <div
              key={stream.id}
              className="border-[3px] border-void bg-surface px-4 py-4"
            >
              <p className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep">
                {stream.title}
              </p>
              <p className="mt-2 font-pixel text-sm font-semibold leading-snug text-parchment sm:text-base">
                {stream.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-[42rem] text-base leading-[1.65] text-muted sm:text-lg">
          {PRIZE_ECOSYSTEM.closing}
        </p>
      </section>

      <PixelCard
        tone="ink"
        size="lg"
        className="mt-10"
        faceClassName="p-5 sm:p-7"
      >
        <h2 className="font-pixel text-xl font-bold text-cream sm:text-2xl">
          {PRIZE_CLOSING.title}
        </h2>
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-cream/85 sm:text-base">
          {PRIZE_CLOSING.support}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ConnectWalletButton label="Connect Wallet" />
          {PRIZE_CTAS.filter((cta) => cta.variant !== "primary").map((cta) => (
            <PixelButtonLink
              key={cta.href}
              href={cta.href}
              variant={cta.variant}
              size="lg"
            >
              {cta.label}
            </PixelButtonLink>
          ))}
        </div>
        <p className="mt-4 font-pixel text-xs font-semibold uppercase tracking-wider text-gold">
          {PRIZE_CLOSING.tagline}
        </p>
      </PixelCard>
    </article>
  );
}

function PrizeBlockView({ block }: { block: PrizeBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-base leading-[1.65] text-muted sm:text-lg">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-base leading-[1.65] text-muted sm:text-lg">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="font-pixel text-sm font-semibold leading-snug text-gold-deep sm:text-base">
      {block.text}
    </p>
  );
}
