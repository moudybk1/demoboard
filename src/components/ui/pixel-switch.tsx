"use client";

import { cn } from "@/lib/utils";

/**
 * Chunky pixel toggle — replaces native checkboxes in settings.
 */
export function PixelSwitch({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full cursor-pointer items-start justify-between gap-4 text-left transition-colors",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="font-pixel text-sm font-semibold uppercase leading-snug text-parchment">
          {label}
        </span>
        {description ? (
          <span className="mt-1.5 block text-sm leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>

      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center pixel-corners border-[3px] px-0.5 transition-[background-color,border-color] duration-[var(--duration-fast)]",
          checked
            ? "border-void bg-gold"
            : "border-void bg-cream",
        )}
      >
        <span
          className={cn(
            "size-5 pixel-corners border-[3px] border-void transition-transform duration-[var(--duration-fast)] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            checked
              ? "translate-x-6 bg-gold-deep"
              : "translate-x-0 bg-muted",
          )}
        />
      </span>
    </button>
  );
}
