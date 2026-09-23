"use client";

import { PixelButtonLink } from "@/components/ui/pixel-button";
import { HOW_TO_CTAS } from "@/lib/mock/how-to";
import { playAppHref } from "@/lib/play-app-url";

export function HowToHeroActions() {
  return (
    <>
      {HOW_TO_CTAS.map((cta) => (
        <PixelButtonLink
          key={cta.href}
          href={cta.variant === "primary" ? playAppHref(cta.href) : cta.href}
          variant={cta.variant}
          size="md"
        >
          {cta.label}
        </PixelButtonLink>
      ))}
    </>
  );
}
