import { cn } from "@/lib/utils";

type PageHeroProps = {
  /** Optional — taste skill: avoid eyebrows on every section. */
  eyebrow?: string;
  title: string;
  support: string;
  meta?: React.ReactNode;
  stage?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Product page hero — sticker header on the felt table.
 */
export function PageHero({
  eyebrow,
  title,
  support,
  meta,
  stage,
  actions,
  className,
}: PageHeroProps) {
  return (
    <header
      data-reveal
      className={cn(
        "relative isolate overflow-hidden pixel-corners-lg border-[4px] border-void bg-cream shadow-pixel-lg",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 90% at 100% 0%, color-mix(in srgb, var(--color-gold) 42%, transparent), transparent 55%),
            radial-gradient(ellipse 50% 70% at 0% 100%, color-mix(in srgb, var(--color-monopoly) 22%, transparent), transparent 60%)
          `,
        }}
      />

      <div
        className={cn(
          "relative grid gap-6 p-5 sm:gap-8 sm:p-7 lg:p-8",
          stage &&
            "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center",
        )}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "max-w-xl font-pixel text-pixel-fluid-lg font-bold leading-[1.2] tracking-tight text-parchment",
              eyebrow ? "mt-3" : "mt-0",
            )}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-[36rem] text-base leading-relaxed text-muted">
            {support}
          </p>
          {meta ? (
            <div className="mt-5 flex flex-wrap gap-2">{meta}</div>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>

        {stage ? (
          <div className="relative min-w-0 lg:justify-self-stretch">
            {stage}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function HeroStat({
  label,
  value,
  pulse,
}: {
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 pixel-corners border-[3px] border-void bg-surface px-3 py-1.5 shadow-pixel-sm">
      {pulse ? (
        <i
          className="size-2 shrink-0 bg-success animate-pulse-glow"
          aria-hidden
        />
      ) : null}
      <span className="font-pixel text-xs font-semibold uppercase leading-none text-faint">
        {label}
      </span>
      <span className="font-pixel text-sm font-bold text-parchment">
        {value}
      </span>
    </span>
  );
}
