import { ConnectWalletButton } from "@/components/layout/connect-wallet-button";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  HOW_TO_CLOSING,
  HOW_TO_FEE,
  HOW_TO_STEPS,
  type HowToBlock,
  type HowToStep,
} from "@/lib/mock/how-to";
import { cn } from "@/lib/utils";

const STEP_TONES = [
  "goldWash",
  "monopoly",
  "ludo",
  "raised",
  "surface",
] as const;

/**
 * How-to steps, fee callout, and closing CTA.
 */
export function HowToSteps({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-12", className)}>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HOW_TO_STEPS.map((step, index) => (
          <HowToStepCard
            key={step.id}
            step={step}
            tone={STEP_TONES[index % STEP_TONES.length]}
            wide={index >= 3}
          />
        ))}
      </ol>

      <HowToFeeCallout />

      <PixelCard tone="ink" faceClassName="p-5 sm:p-7">
        <h2 className="font-pixel text-xl font-bold text-cream sm:text-2xl">
          {HOW_TO_CLOSING.title}
        </h2>
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-cream/85 sm:text-base">
          {HOW_TO_CLOSING.support}
        </p>
        <div className="mt-6">
          <ConnectWalletButton label={HOW_TO_CLOSING.cta} />
        </div>
        <p className="mt-4 font-pixel text-xs font-semibold uppercase tracking-wider text-gold">
          {HOW_TO_CLOSING.tagline}
        </p>
      </PixelCard>
    </div>
  );
}

function HowToFeeCallout() {
  return (
    <PixelCard
      as="section"
      aria-labelledby="how-to-fee-title"
      tone="cream"
      size="lg"
      stroke="gold"
      faceClassName="p-5 sm:p-7 lg:p-8"
    >
      <p className="font-pixel text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
        Fee callout
      </p>
      <h2
        id="how-to-fee-title"
        className="mt-2 font-pixel text-xl font-bold text-parchment sm:text-2xl"
      >
        {HOW_TO_FEE.title}
      </h2>
      <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted sm:text-base">
        {HOW_TO_FEE.lead}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {HOW_TO_FEE.splits.map((split) => (
          <li
            key={split.label}
            className="border-[3px] border-void bg-surface px-4 py-4"
          >
            <p className="font-sans text-2xl font-bold tabular-nums leading-none text-gold-deep">
              {split.percent}%
            </p>
            <p className="mt-2 font-pixel text-xs font-semibold uppercase tracking-wider text-parchment">
              {split.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{split.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 font-pixel text-sm font-semibold leading-snug text-gold-deep sm:text-base">
        {HOW_TO_FEE.formula}
      </p>
    </PixelCard>
  );
}

function HowToStepCard({
  step,
  tone,
  wide,
}: {
  step: HowToStep;
  tone: (typeof STEP_TONES)[number];
  wide?: boolean;
}) {
  return (
    <PixelCard
      as="li"
      tone={tone}
      className={cn(
        "h-full transition-transform duration-[var(--duration-fast)] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5",
        wide && "md:col-span-1 xl:col-span-1",
      )}
      faceClassName="relative flex h-full flex-col p-5"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center border-2 border-gold-deep bg-gold font-pixel text-[12px] text-void shadow-pixel-sm"
          aria-hidden
        >
          {step.number}
        </span>
        <p className="font-pixel text-[11px] font-semibold uppercase leading-snug tracking-wider text-faint">
          {step.label}
        </p>
      </div>

      <h3 className="mt-4 font-pixel text-base font-bold leading-snug text-parchment sm:text-lg">
        <span className="sr-only">Step {step.number}. </span>
        {step.title}
      </h3>

      <div className="mt-3 flex-1 space-y-3">
        {step.answer.map((block, index) => (
          <HowToAnswerBlock key={`${step.id}-${index}`} block={block} />
        ))}
      </div>
    </PixelCard>
  );
}

function HowToAnswerBlock({ block }: { block: HowToBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-sm leading-relaxed text-muted sm:text-base">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="font-pixel text-sm font-semibold leading-snug text-gold-deep">
      {block.text}
    </p>
  );
}
