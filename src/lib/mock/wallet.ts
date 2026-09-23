import { MOCK_BALANCE, MOCK_PLAYER } from "@/lib/mock/lobby";
import type { WalletBalance } from "@/lib/types";

/**
 * Mock wallet surface for Deposit & Withdraw. Later tasks deepen forms,
 * confirmation, errors, history filters, and network warnings against these shapes.
 */

export type WalletTab = "deposit" | "withdraw";

export type MockNetworkStatus = {
  chain: string;
  connected: boolean;
  walletLabel: string;
  warning: string | null;
};

export type MockTx = {
  id: string;
  type: "deposit" | "withdraw" | "entry_fee" | "payout";
  amount: number;
  status: "confirmed" | "pending" | "failed";
  createdAt: string;
  note: string;
};

export const WALLET_PAGE = {
  title: "Deposit & Withdraw",
  support:
    "Move BOARD between your Robinhood Chain wallet and your platform balance. Rooms spend from available balance only.",
};

export const MOCK_WALLET_BALANCE: WalletBalance = MOCK_BALANCE;

export const MOCK_NETWORK: MockNetworkStatus = {
  chain: "Robinhood Chain",
  connected: true,
  walletLabel: `${MOCK_PLAYER.username} · 0xB0A…d41`,
  warning: null,
};

export const DEPOSIT_PRESETS = [500, 1_000, 5_000, 10_000] as const;

export const WITHDRAW_PRESETS = [500, 1_000, 2_500] as const;

export const MOCK_TRANSACTIONS: MockTx[] = [
  {
    id: "tx_01",
    type: "deposit",
    amount: 5_000,
    status: "confirmed",
    createdAt: "2026-09-13T08:12:00.000Z",
    note: "Wallet → platform",
  },
  {
    id: "tx_02",
    type: "entry_fee",
    amount: -1_000,
    status: "confirmed",
    createdAt: "2026-09-13T09:01:00.000Z",
    note: "Joined Monopoly room rm_m_1k",
  },
  {
    id: "tx_03",
    type: "payout",
    amount: 3_920,
    status: "confirmed",
    createdAt: "2026-09-13T10:44:00.000Z",
    note: "Winner payout (2% fee applied)",
  },
  {
    id: "tx_04",
    type: "withdraw",
    amount: -2_000,
    status: "pending",
    createdAt: "2026-09-13T11:20:00.000Z",
    note: "Platform → wallet",
  },
  {
    id: "tx_05",
    type: "deposit",
    amount: 500,
    status: "failed",
    createdAt: "2026-09-12T18:05:00.000Z",
    note: "Rejected · insufficient gas mock",
  },
];

/** Amount that intentionally fails on confirm so the UI can test errors. */
export const MOCK_DEPOSIT_FAIL_AMOUNT = 666;

export const DEPOSIT_STATUS_COPY = {
  pending: "Waiting for Robinhood Chain confirmation…",
  success: "Deposit confirmed. Available balance updated.",
  failed:
    "Deposit failed. The chain rejected the transfer · try a different amount or check gas.",
  invalid: "Enter a valid amount greater than zero.",
  failDemo: `Use ${MOCK_DEPOSIT_FAIL_AMOUNT} BOARD to test a failed deposit.`,
} as const;