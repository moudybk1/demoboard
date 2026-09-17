import { GuideActionBar } from "@/components/welcome/guide-action-bar";
import { PixelCard } from "@/components/ui/pixel-card";
import { HOW_TO_PLANNED, HOW_TO_STEPS, type HowToStep } from "@/lib/mock/how-to";
import { cn } from "@/lib/utils";

const STEP_TONES = [
  "goldWash",
  "monopoly",
  "ludo",
  "raised",
  "surface",
] as const;

export function HowToSteps({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-12", className)}>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HOW_TO_STEPS.map((step, index) => (
          <HowToStepCard
            key={step.id}
            step={step}
            tone={STEP_TONES[index % STEP_TONES.length]}
            wide={index === HOW_TO_STEPS.length - 1}
          />
        ))}
      </ol>

      <section aria-labelledby="planned-live-title">
        <h2
          id="planned-live-title"
          className="font-pixel text-xl font-bold text-parchment sm:text-2xl"
        >
          Planned live-game flow
        </h2>
        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted sm:text-base">
          Deposits, fees, and withdrawals are not available in this closed demo.
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_TO_PLANNED.map((step, index) => (
            <HowToStepCard
              key={step.id}
              step={step}
              tone={STEP_TONES[index % STEP_TONES.length]}
            />
          ))}
        </ol>
      </section>

      <PixelCard tone="ink" faceClassName="p-5 sm:p-6">
        <GuideActionBar
          hint="Enter the closed demo to try the boards. Deposit and payout steps live in Planned live-game flow."
          hintClassName="text-cream/90"
        />
      </PixelCard>
    </div>
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
        wide && "md:col-span-2 xl:col-span-1",
      )}
      faceClassName="relative flex h-full flex-col p-5"
    >
      <span
        className="grid size-11 shrink-0 place-items-center border-2 border-gold-deep bg-gold font-pixel text-[12px] text-void shadow-pixel-sm"
        aria-hidden
      >
        {step.number}
      </span>

      <h3 className="mt-4 font-pixel text-sm font-bold uppercase leading-snug text-parchment sm:text-base">
        <span className="sr-only">Step {step.number}. </span>
        {step.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {step.body}
      </p>
    </PixelCard>
  );
}
