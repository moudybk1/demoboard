"use client";

import { ConnectWalletButton } from "@/components/layout/connect-wallet-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { cn } from "@/lib/utils";

/**
 * Shared guide footer CTAs.
 */
export function GuideActionBar({
  className,
  hint = "Wallet connect is almost ready. Until then, explore how to play and the prize rules.",
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
        <ConnectWalletButton className="w-full sm:w-auto" />
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
