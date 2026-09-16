import type { Metadata } from "next";

import { BalanceStrip } from "@/components/lobby/balance-strip";
import { LobbyBoard } from "@/components/lobby/lobby-board";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { ProductShell } from "@/components/layout/product-shell";
import { SampleDataNotice } from "@/components/layout/sample-data-notice";
import { LobbyHeroActions } from "@/components/lobby/lobby-hero-actions";
import { RoomEconomyHighlight } from "@/components/ui/room-economy-highlight";
import {
  ENTRY_FEE_TIERS,
  GAME_OPTIONS,
  MOCK_BALANCE,
  MOCK_NOW,
  MOCK_ROOMS,
} from "@/lib/mock/lobby";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { formatBoardCompact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lobby | BOARD",
  description:
    "Pick Monopoly or Ludo, browse open rooms by entry fee, and join a four-player table.",
};

export default function LobbyPage() {
  const balance = MOCK_BALANCE;
  const openRooms = MOCK_ROOMS.filter((room) => room.status === "waiting");
  const playingNow = GAME_OPTIONS.reduce(
    (sum, game) => sum + game.activePlayers,
    0,
  );
  const cheapest = Math.min(...openRooms.map((room) => room.entryFee));

  return (
    <ProductShell accent="mint" width="wide">
      <PageHero
        title="Sit a table. Win the pot."
        support="Four seats. One winner. Stake BOARD, crown the board, keep 98% of the pot."
        meta={
          <>
            <HeroStat
              label="Playing"
              value={formatBoardCompact(playingNow)}
              pulse={PLAY_IS_LIVE}
            />
            <HeroStat label="Open" value={String(openRooms.length)} />
            <HeroStat
              label="From"
              value={`${formatBoardCompact(cheapest)} BOARD`}
            />
          </>
        }
        actions={<LobbyHeroActions />}
        stage={
          <div className="grid gap-3 sm:grid-cols-2">
            {GAME_OPTIONS.map((game) => {
              const monopoly = game.type === "monopoly";
              return (
                <div
                  key={game.type}
                  className={
                    monopoly
                      ? "pixel-corners border-[3px] border-void bg-monopoly/20 p-4"
                      : "pixel-corners border-[3px] border-void bg-ludo/20 p-4"
                  }
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
                    {game.openRooms} open ·{" "}
                    {formatBoardCompact(game.activePlayers)} live
                  </p>
                </div>
              );
            })}
          </div>
        }
      />

      <SampleDataNotice />

      <div
        data-reveal
        className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      >
        <BalanceStrip balance={balance} cheapestEntryFee={cheapest} />
        <RoomEconomyHighlight
          entryFee={1_000}
          seats={4}
          balance={balance.available}
          variant="panel"
        />
      </div>

      <div data-reveal>
        <LobbyBoard
          games={GAME_OPTIONS}
          rooms={MOCK_ROOMS}
          feeTiers={ENTRY_FEE_TIERS}
          balance={balance.available}
          now={MOCK_NOW}
          defaultGame={GAME_OPTIONS[0].type}
        />
      </div>
    </ProductShell>
  );
}
