/**
 * Mock win / settle payloads for the Hadiah & Fee Token surfaces.
 */

export type WinPayoutStatus = "paid" | "pending" | "failed";

export type MockWinResult = {
  id: string;
  gameType: "monopoly" | "ludo";
  roomId: string;
  settledAt: string;
  winner: {
    userId: string;
    username: string;
    seat: number;
    isYou: boolean;
  };
  entryFee: number;
  seats: number;
  grossPot: number;
  feePercent: number;
  feeAmount: number;
  treasuryAmount: number;
  buybackAmount: number;
  burnAmount: number;
  netPayout: number;
  payoutStatus: WinPayoutStatus;
  subtitle: string;
};

export const MOCK_WIN_RESULT: MockWinResult = {
  id: "win_m_1k_01",
  gameType: "monopoly",
  roomId: "rm_m_1k",
  settledAt: "2026-09-13T10:44:00.000Z",
  winner: {
    userId: "u_me",
    username: "Yoga",
    seat: 1,
    isYou: true,
  },
  entryFee: 1_000,
  seats: 4,
  grossPot: 4_000,
  feePercent: 2,
  feeAmount: 80,
  treasuryAmount: 24,
  buybackAmount: 28,
  burnAmount: 28,
  netPayout: 3_920,
  payoutStatus: "paid",
  subtitle: "Last player standing takes the pot.",
};

export const MOCK_WIN_HISTORY: MockWinResult[] = [
  MOCK_WIN_RESULT,
  {
    id: "win_l_500_02",
    gameType: "ludo",
    roomId: "rm_l_500",
    settledAt: "2026-09-12T16:20:00.000Z",
    winner: {
      userId: "u_me",
      username: "Yoga",
      seat: 3,
      isYou: true,
    },
    entryFee: 500,
    seats: 4,
    grossPot: 2_000,
    feePercent: 2,
    feeAmount: 40,
    treasuryAmount: 12,
    buybackAmount: 14,
    burnAmount: 14,
    netPayout: 1_960,
    payoutStatus: "pending",
    subtitle: "All four pawns home first.",
  },
  {
    id: "win_m_5k_03",
    gameType: "monopoly",
    roomId: "rm_m_5k",
    settledAt: "2026-09-11T09:05:00.000Z",
    winner: {
      userId: "u_02",
      username: "DiceDuchess",
      seat: 2,
      isYou: false,
    },
    entryFee: 5_000,
    seats: 4,
    grossPot: 20_000,
    feePercent: 2,
    feeAmount: 400,
    treasuryAmount: 120,
    buybackAmount: 140,
    burnAmount: 140,
    netPayout: 19_600,
    payoutStatus: "failed",
    subtitle: "You finished second · no payout this room.",
  },
];
