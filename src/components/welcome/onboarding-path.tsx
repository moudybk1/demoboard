"use client";

import Link from "next/link";

import { SignInButton } from "@/components/account/sign-in-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS } from "@/lib/mock/welcome";
import { cn } from "@/lib/utils";

/**
 * Compact sit-down strip · connect, pick, win.
 */
export function OnboardingPath({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="onboarding-path-title"
      className={cn(
        "relative border-t-[3px] border-void bg-surface/70 py-12 sm:py-14",
        className,
      )}
    >
      <div className="board-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-sm">
            <h2
              id="onboarding-path-title"
              className="font-pixel text-2xl font-bold leading-snug text-parchment sm:text-3xl"
            >
              Sit down in three moves
            </h2>
          </div>

          <ol className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
            {ONBOARDING_STEPS.map((step, index) => (
              <li
                key={step.id}
                className="relative flex flex-1 flex-col pixel-corners border-[3px] border-void bg-cream px-4 py-4 shadow-pixel-sm sm:rounded-none sm:first:rounded-l-sm sm:last:rounded-r-sm"
              >
                <span className="font-pixel text-xs font-semibold text-gold-deep">
                  0{step.index}
                </span>
                {step.id === "deposit" ? (
                  <SignInButton
                    variant="ghost"
                    size="sm"
                    className="mt-2 justify-start px-0 text-base font-bold text-parchment shadow-none hover:text-gold-deep"
                  >
                    {step.title}
                  </SignInButton>
                ) : step.href ? (
                  <Link
                    href={step.href}
                    className="mt-2 text-base font-bold text-parchment hover:text-gold-deep"
                  >
                    {step.title}
                  </Link>
                ) : (
                  <span className="mt-2 text-base font-bold text-parchment">
                    {step.title}
                  </span>
                )}
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-2 top-1/2 z-10 hidden size-4 -translate-y-1/2 rotate-45 border-r-[3px] border-t-[3px] border-void bg-cream sm:block"
                  />
                )}
              </li>
            ))}
          </ol>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            {ONBOARDING_ACTIONS.map((cta) =>
              cta.label === "Sign in" ? (
                <SignInButton
                  key={cta.label}
                  variant={cta.variant}
                  size="md"
                  className="justify-center"
                >
                  Sign in
                </SignInButton>
              ) : (
                <PixelButtonLink
                  key={cta.href}
                  href={cta.href}
                  variant={cta.variant}
                  size="md"
                  className="justify-center"
                >
                  {cta.label}
                </PixelButtonLink>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
