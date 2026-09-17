import { PixelButtonLink } from "@/components/ui/pixel-button";
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS } from "@/lib/mock/welcome";
import { cn } from "@/lib/utils";

/**
 * Three compact steps, then one action. Desktop row, mobile stack.
 */
export function OnboardingPath({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="onboarding-path-title"
      className={cn(
        "relative z-10 overflow-visible bg-felt pb-16 pt-10 sm:pb-20 sm:pt-14",
        className,
      )}
    >
      <div className="board-container">
        <h2
          id="onboarding-path-title"
          className="font-pixel text-2xl font-bold leading-snug text-cream text-shadow-pixel sm:text-3xl"
        >
          How to enter
        </h2>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {ONBOARDING_STEPS.map((step) => (
            <li
              key={step.id}
              className="border-[3px] border-void bg-cream px-4 py-4 shadow-pixel-sm"
            >
              <p className="font-pixel text-xs font-semibold uppercase text-gold-deep">
                {step.index}
              </p>
              <p className="mt-2 font-pixel text-sm font-bold uppercase leading-snug text-parchment">
                {step.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          {ONBOARDING_ACTIONS.map((cta) => (
            <PixelButtonLink
              key={cta.href}
              href={cta.href}
              variant={cta.variant}
              size="md"
              className="justify-center"
            >
              {cta.label}
            </PixelButtonLink>
          ))}
          <p className="text-sm text-cream/85">Access code required</p>
        </div>
      </div>
    </section>
  );
}
