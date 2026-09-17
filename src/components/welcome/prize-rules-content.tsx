import { GuideActionBar } from "@/components/welcome/guide-action-bar";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelHeading } from "@/components/ui/pixel-label";
import {
  FEE_EXAMPLE,
  PRIZE_RULES,
  PRIZE_RULES_INTRO,
} from "@/lib/mock/prize-rules";
import { cn, formatBoard } from "@/lib/utils";

/**
 * Prize and fee guide. Pixel headings, readable body type for long passages.
 */
export function PrizeRulesContent({ className }: { className?: string }) {
  const ex = FEE_EXAMPLE;

  return (
    <article className={cn("text-base leading-[1.65] text-parchment sm:text-lg", className)}>
      <header className="border-b-[3px] border-void pb-8">
        <p className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep">
          Economy
        </p>
        <PixelHeading as="h1" size="lg" className="mt-3">
          {PRIZE_RULES_INTRO.title}
        </PixelHeading>
        <p className="mt-5 max-w-[40rem] text-base leading-[1.65] text-parchment sm:text-lg">
          {PRIZE_RULES_INTRO.support}
        </p>
      </header>

      <ol className="mt-8 space-y-7">
        {PRIZE_RULES.map((rule, index) => (
          <li key={rule.id} className="border-l-[4px] border-gold-deep pl-4 sm:pl-5">
            <p className="font-pixel text-xs font-semibold uppercase tracking-widest text-gold-deep">
              Rule {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-pixel text-lg font-bold leading-snug text-parchment sm:text-xl">
              {rule.title}
            </h2>
            <p className="mt-3 max-w-[42rem] text-base leading-[1.65] text-parchment sm:text-lg">
              {rule.body}
            </p>
          </li>
        ))}
      </ol>

      <PixelCard
        as="aside"
        aria-labelledby="fee-example-title"
        tone="goldWash"
        size="lg"
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
          Entry fee {formatBoard(ex.entryFee)} BOARD x {ex.seats} players
        </p>

        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Gross pot
            </dt>
            <dd className="mt-2 font-pixel text-2xl font-bold leading-none text-parchment">
              {formatBoard(ex.grossPot)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                BOARD
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Fee ({ex.feePercent}%)
            </dt>
            <dd className="mt-2 font-pixel text-2xl font-bold leading-none text-danger">
              {formatBoard(ex.feeAmount)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                BOARD
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs font-semibold uppercase tracking-wider text-gold-deep">
              Winner gets
            </dt>
            <dd className="mt-2 font-pixel text-2xl font-bold leading-none text-success">
              {formatBoard(ex.winnerPayout)}
              <span className="ml-1 font-pixel text-xs font-semibold uppercase tracking-wider text-muted">
                BOARD
              </span>
            </dd>
          </div>
        </dl>
      </PixelCard>

      <div className="mt-10">
        <GuideActionBar
          secondaryHref="/how-to"
          secondaryLabel="How to play"
          hintClassName="text-sm leading-[1.65] text-muted"
        />
      </div>
    </article>
  );
}
