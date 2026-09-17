import type { Metadata } from "next";
import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { SettingsBoard } from "@/components/settings/settings-board";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButtonLink } from "@/components/ui/pixel-button";

export const metadata: Metadata = {
  title: "Settings | BOARD",
  description: "Display and sound preferences for the BOARD cartoon table.",
};

export default function SettingsPage() {
  return (
    <ProductShell accent="mint">
      <PageHero
        title="Settings"
        support="Motion, confetti dots, SFX, and music. Saved on this device."
        meta={
          <>
            <HeroStat label="Scope" value="This device" />
            <HeroStat label="Look" value="Pixel cartoon" />
          </>
        }
        actions={
          <PixelButtonLink href="/account" variant="ghost" size="md">
            Wallet account
          </PixelButtonLink>
        }
        stage={
          <PixelCard tone="cream" faceClassName="p-4 sm:p-5">
            <p className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep">
              Tips
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>Reduce motion softens dice hops and idle bobbing.</li>
              <li>Confetti dots sprinkle candy over the playground.</li>
              <li>
                Also on{" "}
                <Link href="/account" className="font-bold text-gold-deep hover:underline">
                  Account
                </Link>
                .
              </li>
            </ul>
          </PixelCard>
        }
      />

      <div data-reveal>
        <SettingsBoard />
      </div>
    </ProductShell>
  );
}
