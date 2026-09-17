import { PixelButtonLink } from "@/components/ui/pixel-button";
import { cn } from "@/lib/utils";

/**
 * Shared guide footer CTAs.
 */
export function GuideActionBar({
  className,
  hint = "Closed demo. Enter with the project access code, then try a sample table. No real BOARD is staked.",
  hintClassName,
  secondaryHref = "/rules",
  secondaryLabel = "Prizes and fees",
}: {
  className?: string;
  hint?: string;
  hintClassName?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <PixelButtonLink
          href="/demo"
          size="lg"
          variant="primary"
          className="w-full justify-center sm:w-auto"
        >
          Enter demo
        </PixelButtonLink>
        <PixelButtonLink
          href={secondaryHref}
          size="lg"
          variant="secondary"
          className="w-full justify-center sm:w-auto"
        >
          {secondaryLabel}
        </PixelButtonLink>
      </div>
      {hint ? (
        <p
          className={cn(
            "w-full text-xs leading-relaxed text-faint sm:ml-1 sm:max-w-sm",
            hintClassName,
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
