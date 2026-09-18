import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DemoGateForm } from "@/components/demo/demo-gate-form";
import { DemoGatePreview } from "@/components/demo/demo-gate-preview";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import {
  DEMO_COOKIE_NAME,
  DEMO_DEFAULT_NEXT,
  hasDemoCookieValue,
  safeNextPath,
} from "@/lib/demo-access";
import {
  lobbyPathForGame,
  parsePreviewGame,
} from "@/lib/preview-game";

export const metadata: Metadata = {
  title: "Enter closed demo | BOARD",
  description:
    "BOARD is not live yet. Enter the closed demo with an access code to try Monopoly and Ludo tables. Nothing here stakes or pays out BOARD.",
};

type DemoPageProps = {
  searchParams: Promise<{
    code?: string | string[];
    next?: string | string[];
    error?: string | string[];
    game?: string | string[];
  }>;
};

/**
 * Closed-demo gate. A project link of `/demo?code=…` (or `/api/demo/enter?code=…`)
 * unlocks the playable tables without a form.
 */
export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const code = first(params.code);
  const game = parsePreviewGame(first(params.game));
  const next = safeNextPath(
    first(params.next) ?? (game ? lobbyPathForGame(game) : DEMO_DEFAULT_NEXT),
  );
  const error = first(params.error);
  const jar = await cookies();

  if (code) {
    const enter = new URLSearchParams();
    enter.set("code", code);
    enter.set("next", next);
    redirect(`/api/demo/enter?${enter.toString()}`);
  }

  if (hasDemoCookieValue(jar.get(DEMO_COOKIE_NAME)?.value)) {
    redirect(next);
  }

  return (
    <div className="board-atmosphere flex min-h-full flex-col">
      <SiteHeader />
      <main className="board-container flex flex-1 items-center py-8 sm:py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <PixelCard size="lg" faceClassName="p-5 sm:p-7">
            <p className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep">
              Closed demo
            </p>
            <h1 className="mt-3 font-pixel text-3xl font-bold leading-snug text-parchment sm:text-4xl">
              Enter the closed demo
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Enter your invitation code to explore{" "}
              {game === "ludo" ? "Ludo" : game === "monopoly" ? "Monopoly" : "Monopoly or Ludo"}{" "}
              with demo balances. No real tokens are used.
            </p>
            <div className="mt-6">
              <DemoGateForm nextPath={next} game={game} errorCode={error} />
            </div>
            <p className="mt-5 border-t-[3px] border-void pt-4 text-sm text-muted">
              No code yet?{" "}
              <Link href="/#try-a-turn" className="text-link underline hover:text-parchment">
                Watch a turn
              </Link>
              {" · "}
              <Link href="/how-to" className="text-link underline hover:text-parchment">
                How to play
              </Link>
            </p>
          </PixelCard>

          <div className="hidden max-w-md lg:block">
            <DemoGatePreview game={game} />
            <div className="mt-4 flex flex-wrap gap-2">
              <PixelButtonLink href="/how-to" variant="secondary" size="sm">
                How to play
              </PixelButtonLink>
              <PixelButtonLink href="/rules" variant="outline" size="sm">
                Prizes and fees
              </PixelButtonLink>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
