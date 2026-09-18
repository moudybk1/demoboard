"use client";

import { ConnectWalletButton } from "@/components/layout/connect-wallet-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { HOW_TO_CTAS } from "@/lib/mock/how-to";

export function HowToHeroActions() {
  const secondary = HOW_TO_CTAS.find((cta) => cta.variant === "secondary");

  return (
    <>
      <ConnectWalletButton size="md" />
      {secondary ? (
        <PixelButtonLink
          href={secondary.href}
          variant={secondary.variant}
          size="md"
        >
          {secondary.label}
        </PixelButtonLink>
      ) : null}
    </>
  );
}
