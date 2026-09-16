import { GuideActionBar } from "@/components/welcome/guide-action-bar";
import { HOW_TO_STEPS, type HowToStep } from "@/lib/mock/how-to";
import { cn } from "@/lib/utils";

const STEP_ACCENTS = [
  "border-gold/50 bg-gold/8",
  "border-monopoly/45 bg-monopoly/8",
  "border-ludo/45 bg-ludo/8",
  "border-gold/40 bg-surface-raised",
  "border-success/40 bg-success/8",
] as const;

export function HowToSteps({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {HOW_TO_STEPS.map((step, index) => (
          <HowToStepCard
            key={step.id}
            step={step}
            accent={STEP_ACCENTS[index % STEP_ACCENTS.length]}
            wide={index === HOW_TO_STEPS.length - 1}
          />
        ))}
      </ol>

      <GuideActionBar
        className="border-2 border-edge-bright bg-void/50 p-5 shadow-pixel sm:p-6"
        hint="Deposit first if your balance is empty, then pick a room in the lobby."
      />
    </div>
  );
}

function HowToStepCard({
  step,
  accent,
  wide,
}: {
  step: HowToStep;
  accent: string;
  wide?: boolean;
}) {
  return (
    <li
      className={cn(
        "relative flex flex-col border-2 p-5 shadow-pixel-sm transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-pixel",
        accent,
        wide && "md:col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center border-2 border-gold-deep bg-gold font-pixel text-[12px] text-void shadow-pixel-sm"
          aria-hidden
        >
          {step.number}
        </span>
        <span className="font-pixel text-xs uppercase text-faint">
          Step {step.number}
        </span>
      </div>

      <h2 className="mt-4 font-pixel text-[11px] leading-relaxed text-parchment sm:text-xs">
        <span className="sr-only">Step {step.number}. </span>
        {step.title}
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {step.body}
      </p>
    </li>
  );
}
