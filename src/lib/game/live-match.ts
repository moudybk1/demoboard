import type { DieValue } from "@/lib/game/dice";
import type { MonopolyPlayState } from "@/lib/game/monopoly-rules";
import type { LudoRoomState } from "@/lib/mock/ludo";

export type PlaySettlement = {
  status: "pending" | "submitted" | "confirmed" | "failed" | "house";
  grossPot: string;
  feeAmount: string;
  netPayout: string;
  txHash: `0x${string}` | null;
  confirmedAt: string | null;
  error: string | null;
};

export type LiveMatchBase = {
  id: string;
  version: number;
  deadline: number;
  winnerSeat: number | null;
  fundedSeats: number;
  settlement: PlaySettlement | null;
};

export type LiveMatch = LiveMatchBase &
  (
    | {
        game: "monopoly";
        state: MonopolyPlayState;
        dice: readonly [DieValue, DieValue] | null;
        pendingBuy: number | null;
        extraTurn: boolean;
      }
    | {
        game: "ludo";
        state: LudoRoomState;
        die: DieValue | null;
        sixes: number;
      }
  );

export type MatchAction =
  | "roll"
  | "move"
  | "buy"
  | "skip"
  | "end-turn"
  | "pay-jail"
  | "forfeit";
