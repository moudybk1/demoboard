import { ENTRY_FEE_TIERS } from "@/lib/mock/lobby";
import {
  MAX_PLAYERS_PER_ROOM,
  PRIZE_FEE_RATE,
} from "@/lib/types";

/**
 * Canonical room-economy knobs for BOARD tables: seats, fee rate, entry tiers,
 * and pot math. Settle services and the guide/rules API should read from here
 * instead of hard-coding 4 / 2% / example numbers in multiple places.
 *
 * Protocol fee split matches public marketing:
 * 30% development · 35% buyback · 35% burn.
 */

export type RoomEconomyConfig = {
  maxPlayers: number;
  prizeFeeRate: number;
  prizeFeePercent: number;
  winnerShareRate: number;
  chain: string;
  tokenSymbol: string;
  entryFeeTiers: readonly number[];
  /** Where the 2% fee slice goes. */
  feeDestination: {
    /** Development / ops (ledger kind: treasury). */
    treasuryShare: number;
    buybackShare: number;
    burnShare: number;
  };
};

export type RoomEconomyBreakdown = {
  entryFee: number;
  seats: number;
  grossPot: number;
  feeRate: number;
  feeAmount: number;
  winnerPayout: number;
  /** Development share of the protocol fee. */
  treasuryAmount: number;
  buybackAmount: number;
  burnAmount: number;
};

const DEFAULT_CONFIG: RoomEconomyConfig = {
  maxPlayers: MAX_PLAYERS_PER_ROOM,
  prizeFeeRate: PRIZE_FEE_RATE,
  prizeFeePercent: Math.round(PRIZE_FEE_RATE * 100),
  winnerShareRate: 1 - PRIZE_FEE_RATE,
  chain: "Robinhood Chain",
  tokenSymbol: "BOARD",
  entryFeeTiers: ENTRY_FEE_TIERS,
  feeDestination: {
    treasuryShare: 0.3,
    buybackShare: 0.35,
    burnShare: 0.35,
  },
};

/** Current economy config (static for now; later may load from DB/env). */
export function getRoomEconomyConfig(): RoomEconomyConfig {
  return DEFAULT_CONFIG;
}

function roundBoard(amount: number) {
  return Math.round(amount * 100) / 100;
}

/**
 * Break down pot / fee / winner payout for a room with the given entry fee.
 * `seats` defaults to maxPlayers (full table).
 */
export function calculateRoomEconomy(
  entryFee: number,
  seats: number = DEFAULT_CONFIG.maxPlayers,
  config: RoomEconomyConfig = DEFAULT_CONFIG,
): RoomEconomyBreakdown {
  if (!Number.isFinite(entryFee) || entryFee < 0) {
    throw new Error("entryFee must be a non-negative number.");
  }
  if (!Number.isFinite(seats) || seats < 1) {
    throw new Error("seats must be at least 1.");
  }

  const grossPot = roundBoard(entryFee * seats);
  const feeAmount = roundBoard(grossPot * config.prizeFeeRate);
  const winnerPayout = roundBoard(grossPot - feeAmount);
  const treasuryAmount = roundBoard(
    feeAmount * config.feeDestination.treasuryShare,
  );
  const buybackAmount = roundBoard(
    feeAmount * config.feeDestination.buybackShare,
  );
  const burnAmount = roundBoard(feeAmount - treasuryAmount - buybackAmount);

  return {
    entryFee,
    seats,
    grossPot,
    feeRate: config.prizeFeeRate,
    feeAmount,
    winnerPayout,
    treasuryAmount,
    buybackAmount,
    burnAmount,
  };
}

/** Example used by the prize-rules guide (1,000 BOARD entry × 4 seats). */
export function getEconomyExample(
  entryFee = 1_000,
): RoomEconomyBreakdown {
  return calculateRoomEconomy(entryFee);
}
