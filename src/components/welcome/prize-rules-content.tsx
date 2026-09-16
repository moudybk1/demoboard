import { GuideActionBar } from "@/components/welcome/guide-action-bar";
import {
  FEE_EXAMPLE,
  PRIZE_RULES,
  PRIZE_RULES_INTRO,
} from "@/lib/mock/prize-rules";
import { cn, formatBoard } from "@/lib/utils";

export function PrizeRulesContent({ className }: { className?: string }) {
  const ex = FEE_EXAMPLE;

  return (
    <div className={cn("space-y-10", className)}>
      <header className="border-b-2 border-edge pb-8">
        <p className="font-pixel text-xs uppercase tracking-widest text-gold">
          Economy
        </p>
        <h1 className="mt-3 font-pixel text-lg font-bold text-parchment text-shadow-pixel sm:text-xl">
          {PRIZE_RULES_INTRO.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          {PRIZE_RULES_INTRO.support}
        </p>
      </header>

      <ul className="space-y-6">
        {PRIZE_RULES.map((rule) => (
          <li key={rule.id} className="border-l-2 border-gold/40 pl-4">
            <h2 className="font-pixel text-[11px] text-parchment">{rule.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{rule.body}</p>
          </li>
        ))}
      </ul>

      <aside
        aria-labelledby="fee-example-title"
        className="pixel-corners border-2 border-edge bg-surface/50 p-5 shadow-pixel-sm sm:p-6"
      >
        <h2
          id="fee-example-title"
          className="font-pixel text-[10px] uppercase tracking-widest text-gold"
        >
          Example room
        </h2>
        <p className="mt-3 text-sm text-muted">
          Entry fee {formatBoard(ex.entryFee)} BOARD × {ex.seats} players
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-pixel text-xs uppercase text-faint">
              Gross pot
            </dt>
            <dd className="mt-2 font-pixel text-xs text-parchment">
              {formatBoard(ex.grossPot)} BOARD
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs uppercase text-faint">
              Fee ({ex.feePercent}%)
            </dt>
            <dd className="mt-2 font-pixel text-xs text-danger">
              −{formatBoard(ex.feeAmount)} BOARD
            </dd>
          </div>
          <div>
            <dt className="font-pixel text-xs uppercase text-faint">
              Winner gets
            </dt>
            <dd className="mt-2 font-pixel text-xs text-gold">
              {formatBoard(ex.winnerPayout)} BOARD
            </dd>
          </div>
        </dl>
      </aside>

      <GuideActionBar />
    </div>
  );
}
