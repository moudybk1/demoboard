"use client";

import { ActionBar } from "@/components/room/action-bar";
import { ActivityLog } from "@/components/room/activity-log";
import { BoardStage } from "@/components/room/board-stage";
import { BuyPanel } from "@/components/room/buy-panel";
import { PawnLayer } from "@/components/room/pawn-layer";
import { PlayerRail } from "@/components/room/player-rail";
import { WinnerScreen } from "@/components/room/winner-screen";
import { BOARD_TILES } from "@/lib/game/monopoly-board";
import { JAIL_FINE } from "@/lib/game/monopoly-rules";
import type { LiveMatch, MatchAction } from "@/lib/game/live-match";

export function MonopolyRoom({
  match,
  address,
  busy,
  connected,
  secondsLeft,
  onAction,
  onSettle,
}: {
  match: Extract<LiveMatch, { game: "monopoly" }>;
  address?: string;
  busy: boolean;
  connected: boolean;
  secondsLeft: number;
  onAction: (action: MatchAction, pawnId?: string) => void;
  onSettle: () => void;
}) {
  const state = match.state;
  const players = state.players.map((player) => ({
    ...player,
    isYou: player.id.toLowerCase() === address?.toLowerCase(),
  }));
  const you = players.find((player) => player.isYou);
  const yourTurn =
    connected &&
    !busy &&
    match.winnerSeat === null &&
    you?.status === "alive" &&
    you.position === state.activeSeat;
  const winner = players.find((player) => player.position === match.winnerSeat);
  const pending =
    match.pendingBuy === null ? null : BOARD_TILES[match.pendingBuy];
  const canBuy = Boolean(
    yourTurn && pending && (you?.cash ?? 0) >= (pending.price ?? 0),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
      <PlayerRail
        players={players}
        activeSeat={state.activeSeat}
        className="order-2 lg:order-1"
      />
      <div className="order-1 flex flex-col gap-4 lg:order-2">
        <BoardStage
          owners={state.owners}
          activeTile={
            players.find((p) => p.position === state.activeSeat)?.tile
          }
          overlay={
            <>
              <PawnLayer
                pawns={players.map((p) => ({
                  id: p.id,
                  seat: p.position,
                  username: p.username,
                  tile: p.tile,
                  eliminated: p.status === "eliminated",
                }))}
              />
              {pending && yourTurn && (
                <BuyPanel
                  tile={pending}
                  cash={you?.cash ?? 0}
                  onBuy={() => onAction("buy")}
                  onDecline={() => onAction("end-turn")}
                />
              )}
              {winner && (
                <WinnerScreen
                  game="monopoly"
                  winner={{
                    seat: winner.position,
                    username: winner.username,
                    isYou: winner.isYou,
                    pot: Number(match.settlement?.grossPot ?? 0),
                  }}
                  settlement={match.settlement}
                  matchId={match.id}
                  onSettle={onSettle}
                  settling={busy}
                />
              )}
            </>
          }
        />
        <ActionBar
          yourTurn={yourTurn}
          rolling={busy}
          dice={match.dice}
          canBuy={canBuy}
          canPayJail={Boolean(
            yourTurn &&
              you &&
              state.extras[you.position]?.inJail &&
              you.cash >= JAIL_FINE,
          )}
          hasRolled={pending !== null}
          secondsLeft={yourTurn ? secondsLeft : null}
          onRoll={() => onAction("roll")}
          onBuy={() => onAction("buy")}
          onEndTurn={() => onAction("end-turn")}
          onPayJail={() => onAction("pay-jail")}
        />
        {you?.status === "eliminated" && (
          <p className="text-center text-sm text-muted">
            You are out. The remaining players are still playing.
          </p>
        )}
      </div>
      <ActivityLog entries={state.log} className="order-3" />
    </div>
  );
}
