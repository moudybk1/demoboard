import type { Metadata } from "next";

import { LobbyBoard } from "@/components/lobby/lobby-board";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { ProductShell } from "@/components/layout/product-shell";
import { LobbyHeroActions } from "@/components/lobby/lobby-hero-actions";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  ENTRY_FEE_TIERS,
  GAME_OPTIONS,
  MOCK_BALANCE,
  MOCK_NOW,
  MOCK_ROOMS,
} from "@/lib/mock/lobby";
import { parsePreviewGame } from "@/lib/preview-game";

export const metadata: Metadata = {
  title: "Lobby | BOARD",
  description:
    "Start Monopoly or Ludo. Four seats, three rivals, one winner.",
};

type LobbyPageProps = {
  searchParams: Promise<{ game?: string | string[] }>;
};

export default async function LobbyPage({ searchParams }: LobbyPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.game) ? params.game[0] : params.game;
  const defaultGame = parsePreviewGame(raw) ?? undefined;

  return (
    <ProductShell accent="mint" width="wide">
      <PageHero
        title="Sit a table. Win the pot."
        support="Four seats. You plus three rivals. Last player standing keeps the match pot."
        meta={
          <>
            <HeroStat label="Seats" value="4" pulse />
            <HeroStat label="Rivals" value="3" />
            <HeroStat label="Games" value="2" />
          </>
        }
        actions={<LobbyHeroActions game={defaultGame ?? "monopoly"} />}
        stage={
          <div className="grid gap-3 sm:grid-cols-2">
            {GAME_OPTIONS.map((game) => {
              const monopoly = game.type === "monopoly";
              return (
                <PixelCard
                  key={game.type}
                  size="sm"
                  tone={monopoly ? "monopoly" : "ludo"}
                  faceClassName="p-4"
                >
                  <p
                    className={
                      monopoly
                        ? "font-pixel text-xs font-semibold uppercase text-monopoly"
                        : "font-pixel text-xs font-semibold uppercase text-ludo"
                    }
                  >
                    {game.name}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {game.tagline}
                  </p>
                  <p className="mt-3 font-pixel text-xs font-semibold uppercase text-faint">
                    Instant table · you + 3 rivals
                  </p>
                </PixelCard>
              );
            })}
          </div>
        }
      />

      <div data-reveal>
        <LobbyBoard
          games={GAME_OPTIONS}
          rooms={MOCK_ROOMS}
          feeTiers={ENTRY_FEE_TIERS}
          balance={MOCK_BALANCE.available}
          now={MOCK_NOW}
          defaultGame={defaultGame}
        />
      </div>
    </ProductShell>
  );
}
