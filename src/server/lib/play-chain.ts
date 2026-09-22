import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  hexToString,
  http,
  parseEther,
  keccak256,
  parseTransaction,
  recoverTransactionAddress,
  type Hex,
  type TransactionSerialized,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { PLAY_ENTRY_FEE_ETH } from "@/lib/game/play-player";
import { boardRpcFetch } from "@/server/lib/board-rpc-fetch";
import { playDataPath } from "@/server/lib/play-data-path";
import { withPlayDocument } from "@/server/lib/play-store";
import {
  getBoardChain,
  getBoardChainId,
  getBoardExplorerUrl,
  getBoardRpcUrl,
} from "@/lib/wallet/chains";

const TREASURY_PATH = playDataPath("play-treasury.json");

export const PLAY_SIT_VALUE = parseEther(PLAY_ENTRY_FEE_ETH);

type TreasuryFile = {
  address: Hex;
  privateKey: Hex;
};

function readTreasuryFile(): TreasuryFile | null {
  try {
    const parsed = JSON.parse(
      readFileSync(TREASURY_PATH, "utf8"),
    ) as TreasuryFile;
    if (
      /^0x[a-fA-F0-9]{40}$/.test(parsed.address) &&
      /^0x[a-fA-F0-9]{64}$/.test(parsed.privateKey)
    ) {
      return parsed;
    }
  } catch {
    // missing or unreadable
  }
  return null;
}

function writeTreasuryFile(file: TreasuryFile) {
  mkdirSync(dirname(TREASURY_PATH), { recursive: true });
  writeFileSync(TREASURY_PATH, `${JSON.stringify(file, null, 2)}\n`, {
    mode: 0o600,
  });
}

function loadTreasury(): TreasuryFile {
  const fromEnv = process.env.PLAY_TREASURY_PRIVATE_KEY?.trim();
  if (fromEnv && /^0x[a-fA-F0-9]{64}$/.test(fromEnv)) {
    const account = privateKeyToAccount(fromEnv as Hex);
    return { address: account.address, privateKey: fromEnv as Hex };
  }

  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  ) {
    throw new Error(
      "PLAY_TREASURY_PRIVATE_KEY is required for paid play outside local development.",
    );
  }

  const existing = readTreasuryFile();
  if (existing) return existing;

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const created = { address: account.address, privateKey };
  try {
    writeTreasuryFile(created);
  } catch (error) {
    // Vercel / serverless filesystems are read-only. Without
    // PLAY_TREASURY_PRIVATE_KEY the house wallet cannot persist; sit refunds
    // will fail until the env key is set.
    console.error(
      "[play-treasury] could not persist treasury file · set PLAY_TREASURY_PRIVATE_KEY",
      error,
    );
  }
  console.info(
    `[play-treasury] created ${account.address} · faucet it so refunds can pay gas`,
  );
  return created;
}

let treasury: TreasuryFile | undefined;
function getTreasury() {
  return (treasury ??= loadTreasury());
}

export function getPlayTreasuryAddress(): Hex {
  return getTreasury().address;
}

export async function getPlayChainHead() {
  return publicClient().getBlockNumber();
}

function publicClient() {
  return createPublicClient({
    chain: getBoardChain(),
    transport: http(getBoardRpcUrl(), {
      fetchFn: boardRpcFetch,
      timeout: 8_000,
      retryCount: 1,
      retryDelay: 200,
    }),
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("rpc_timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type SitTxError = {
  code: "TX_NOT_FOUND" | "TX_FAILED" | "TX_MISMATCH";
  message: string;
};

/**
 * Confirm a sit payment: successful native transfer of the entry fee from the
 * player to the play treasury on the active Robinhood chain.
 * Client already waited for the receipt; keep this tight so seating is not laggy.
 */
/** Empty calldata is a legacy sit. New sits embed the lobby table id. */
export function sitPaymentMatchesTable(
  input: Hex | null | undefined,
  tableId: string,
) {
  if (!input || input === "0x") return true;
  try {
    const text = hexToString(input).replace(/\0/g, "").trim().toUpperCase();
    if (!text) return true;
    const wanted = tableId.toUpperCase();
    return text === wanted;
  } catch {
    return false;
  }
}

export async function verifySitTransaction(input: {
  hash: Hex;
  from: Hex;
  tableId?: string;
}): Promise<{ ok: true } | { ok: false; error: SitTxError }> {
  const client = publicClient();
  const expectedTo = getTreasury().address.toLowerCase();
  const expectedFrom = input.from.toLowerCase();

  let tx: Awaited<ReturnType<typeof client.getTransaction>> | null = null;
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null =
    null;

  // Stay inside a serverless timeout. The client retries seating.
  const started = Date.now();
  const budgetMs = 8_000;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining < 500) break;
    const attemptMs = Math.min(3_000, remaining);
    if (!tx) {
      try {
        tx = await withTimeout(
          client.getTransaction({ hash: input.hash }),
          attemptMs,
        );
      } catch {
        // not indexed yet
      }
    }
    if (tx && !receipt) {
      try {
        receipt = await withTimeout(
          client.getTransactionReceipt({ hash: input.hash }),
          attemptMs,
        );
      } catch {
        // receipt can lag the transaction
      }
    }
    if (tx && receipt) break;
    if (Date.now() - started > budgetMs) break;
    await sleep(300);
  }

  if (!tx || !receipt) {
    return {
      ok: false,
      error: {
        code: "TX_NOT_FOUND",
        message: "Sit transaction was not found on Robinhood Chain yet.",
      },
    };
  }

  if (receipt.status !== "success") {
    return {
      ok: false,
      error: { code: "TX_FAILED", message: "Sit transaction failed." },
    };
  }

  const chainId = tx.chainId ?? getBoardChainId();
  if (chainId !== getBoardChainId()) {
    return {
      ok: false,
      error: {
        code: "TX_MISMATCH",
        message: "Sit transaction is on the wrong chain.",
      },
    };
  }

  const to = tx.to?.toLowerCase();
  const from = tx.from.toLowerCase();
  if (to !== expectedTo || from !== expectedFrom) {
    return {
      ok: false,
      error: {
        code: "TX_MISMATCH",
        message:
          "Sit transaction does not pay the play treasury from this wallet.",
      },
    };
  }

  if (tx.value !== PLAY_SIT_VALUE) {
    return {
      ok: false,
      error: {
        code: "TX_MISMATCH",
        message: `Sit must send exactly ${PLAY_ENTRY_FEE_ETH} ETH.`,
      },
    };
  }

  if (input.tableId && !sitPaymentMatchesTable(tx.input, input.tableId)) {
    return {
      ok: false,
      error: {
        code: "TX_MISMATCH",
        message: "Sit payment is for a different table.",
      },
    };
  }

  const cutoff = await withPlayDocument<{ entryCutoverBlock?: string }, string | undefined>(
    "play-tables", () => ({}), async (record) => record.entryCutoverBlock,
  );
  if (!cutoff || !/^\d+$/.test(cutoff) || receipt.blockNumber < BigInt(cutoff)) {
    return { ok: false, error: { code: "TX_MISMATCH", message: "This payment predates the current ledger or its cutover is not approved. Do not pay again for recovery; contact support with this transaction hash." } };
  }
  return { ok: true };
}

type ExplorerTx = {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  timeStamp?: string;
  isError?: string;
  txreceipt_status?: string;
};

async function treasuryExplorerRows(): Promise<ExplorerTx[]> {
  const url = `${getBoardExplorerUrl()}/api?module=account&action=txlist&address=${getTreasury().address}&sort=desc&page=1&offset=80`;
  try {
    const response = await boardRpcFetch(url, {
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { result?: ExplorerTx[] };
    return Array.isArray(payload.result) ? payload.result : [];
  } catch {
    return [];
  }
}

/** Successful unused-candidate sit payments to the treasury, oldest first. */
export async function listSuccessfulSitHashes(from: Hex): Promise<Hex[]> {
  const rows = await treasuryExplorerRows();
  const fromKey = from.toLowerCase();
  const treasuryKey = getTreasury().address.toLowerCase();
  const value = PLAY_SIT_VALUE.toString();
  return rows
    .filter(
      (row) =>
        row.hash &&
        row.from?.toLowerCase() === fromKey &&
        row.to?.toLowerCase() === treasuryKey &&
        row.value === value &&
        row.isError === "0" &&
        row.txreceipt_status === "1",
    )
    .map((row) => row.hash!.toLowerCase() as Hex)
    .reverse();
}

/**
 * True when the house already sent this sit fee back. A missing explorer
 * response is treated as not refunded so a seated player can still rejoin.
 */
export async function sitWasRefunded(input: {
  hash: Hex;
  from: Hex;
}): Promise<boolean> {
  const rows = await treasuryExplorerRows();
  const sit = rows.find(
    (row) => row.hash?.toLowerCase() === input.hash.toLowerCase(),
  );
  if (!sit?.timeStamp) return false;
  const sitTime = Number(sit.timeStamp);
  if (!Number.isFinite(sitTime)) return false;
  const player = input.from.toLowerCase();
  const house = getTreasury().address.toLowerCase();
  const value = PLAY_SIT_VALUE.toString();
  return rows.some(
    (row) =>
      row.hash?.toLowerCase() !== input.hash.toLowerCase() &&
      row.from?.toLowerCase() === house &&
      row.to?.toLowerCase() === player &&
      row.value === value &&
      row.isError === "0" &&
      row.txreceipt_status === "1" &&
      Number(row.timeStamp) >= sitTime,
  );
}

export type RefundSitResult =
  | { ok: true; hash: Hex; status: "submitted" | "confirmed" }
  | { ok: false; code: "INSUFFICIENT_FUNDS" | "SEND_FAILED"; message: string };

export type SignedPlayTransfer = { raw: Hex; hash: Hex; nonce: number };

/** Validate signed bytes, not caller-provided or stale journal metadata. */
export async function assertPlayTransfer(transfer: SignedPlayTransfer, to?: Hex, amount?: string) {
  const serializedTransaction = transfer.raw as TransactionSerialized;
  const tx = parseTransaction(serializedTransaction);
  const sender = await recoverTransactionAddress({ serializedTransaction });
  if (keccak256(transfer.raw) !== transfer.hash || tx.nonce !== transfer.nonce ||
      tx.chainId !== getBoardChainId() || sender.toLowerCase() !== getTreasury().address.toLowerCase() ||
      (to && tx.to?.toLowerCase() !== to.toLowerCase()) ||
      (amount && tx.value !== parseEther(amount))) {
    throw new Error("Signed payment intent does not match its network, treasury, recipient or amount. Manual review required.");
  }
}

function nonceDocumentKey() {
  return `play-nonce-${getBoardChainId()}-${getTreasury().address.toLowerCase()}`;
}

/** Called while holding the shared treasury lock. Save the signed intent before sending it. */
export async function preparePlayTransfer(
  to: Hex,
  amount: string,
  intentId: string,
): Promise<SignedPlayTransfer> {
  const account = privateKeyToAccount(getTreasury().privateKey);
  const client = publicClient();
  const value = parseEther(amount);
  const wallet = createWalletClient({
    account,
    chain: getBoardChain(),
    transport: http(getBoardRpcUrl(), { fetchFn: boardRpcFetch }),
  });
  return withPlayDocument<
    { nextNonce?: number; transfers?: Record<string, SignedPlayTransfer> },
    SignedPlayTransfer
  >(
    nonceDocumentKey(),
    () => ({}),
    async (record) => {
      record.transfers ??= {};
      if (record.transfers[intentId]) {
        await assertPlayTransfer(record.transfers[intentId], to, amount);
        return record.transfers[intentId];
      }
      const chainNonce = await client.getTransactionCount({
        address: account.address,
        blockTag: "pending",
      });
      const nonce = Math.max(chainNonce, record.nextNonce ?? chainNonce);
      const prepared = await wallet.prepareTransactionRequest({
        account,
        to,
        value,
        nonce,
      });
      const balance = await client.getBalance({ address: account.address });
      const cost =
        value +
        prepared.gas *
          (prepared.maxFeePerGas ?? prepared.gasPrice ?? BigInt(0));
      if (balance < cost)
        throw new Error(
          "The house has insufficient funds for the payout and gas.",
        );
      const raw = await account.signTransaction({
        chainId: getBoardChainId(),
        to,
        value,
        nonce,
        gas: prepared.gas,
        ...(prepared.maxFeePerGas != null
          ? {
              type: "eip1559" as const,
              maxFeePerGas: prepared.maxFeePerGas,
              maxPriorityFeePerGas: prepared.maxPriorityFeePerGas ?? BigInt(0),
            }
          : { type: "legacy" as const, gasPrice: prepared.gasPrice! }),
      });
      record.nextNonce = nonce + 1;
      const transfer = { raw, hash: keccak256(raw), nonce };
      record.transfers[intentId] = transfer;
      return transfer;
    },
  );
}

export async function broadcastPlayTransfer(transfer: SignedPlayTransfer) {
  await assertPlayTransfer(transfer);
  const hash = await publicClient().sendRawTransaction({
    serializedTransaction: transfer.raw,
  });
  if (hash.toLowerCase() !== transfer.hash.toLowerCase())
    throw new Error("Unexpected payout transaction hash.");
}

export async function playTransferReceipt(
  hash: Hex,
): Promise<"confirmed" | "failed" | "pending"> {
  try {
    const client = publicClient();
    const receipt = await client.getTransactionReceipt({ hash });
    if (receipt.status !== "success") return "failed";
    const head = await client.getBlockNumber();
    return head >= receipt.blockNumber ? "confirmed" : "pending";
  } catch {
    return "pending";
  }
}

export async function getPlayTreasuryStatus() {
  const client = publicClient();
  try {
    const balance = await client.getBalance({ address: getTreasury().address });
    const fees = await client.estimateFeesPerGas();
    const zero = BigInt(0);
    const fallbackGas = BigInt(21_000);
    const maxFee = fees.maxFeePerGas ?? fees.gasPrice ?? zero;
    const gasCost = fallbackGas * maxFee;
    return {
      address: getTreasury().address,
      balanceWei: balance.toString(),
      balanceEth: formatEther(balance),
      canRefund: balance >= PLAY_SIT_VALUE + gasCost,
    };
  } catch {
    return {
      address: getTreasury().address,
      balanceWei: "0",
      balanceEth: "0",
      canRefund: false,
    };
  }
}

/**
 * Return the 0.002 ETH sit fee. The house wallet must also hold gas; if it
 * only holds the sit amount, this fails with INSUFFICIENT_FUNDS so the table
 * service can unseat the player and retry later.
 */
export async function refundSit(
  to: Hex,
  intentId: string,
): Promise<RefundSitResult> {
  try {
    const transfer = await preparePlayTransfer(
      to,
      PLAY_ENTRY_FEE_ETH,
      `refund:${intentId}`,
    );
    const receipt = await playTransferReceipt(transfer.hash);
    if (receipt === "failed")
      return {
        ok: false,
        code: "SEND_FAILED",
        message: "The refund reverted. Contact support.",
      };
    if (receipt !== "confirmed") await broadcastPlayTransfer(transfer);
    return { ok: true, hash: transfer.hash, status: receipt === "confirmed" ? "confirmed" : "submitted" };
  } catch {
    return {
      ok: false,
      code: "SEND_FAILED",
      message:
        "Refund pending. The house will retry the same refund transaction.",
    };
  }
}

/** Recover reservations committed before broadcast, including historical refunds.
 * A missing receipt never justifies allocating a replacement nonce.
 */
export async function reconcileTreasuryTransfers() {
  const transfers = await withPlayDocument<{ transfers?: Record<string, SignedPlayTransfer> }, SignedPlayTransfer[]>(
    nonceDocumentKey(), () => ({}), async (record) => Object.values(record.transfers ?? {}),
  );
  let pending = 0;
  const failures: string[] = [];
  for (const transfer of transfers.sort((a, b) => a.nonce - b.nonce)) {
    try {
      await assertPlayTransfer(transfer);
      const receipt = await playTransferReceipt(transfer.hash);
      if (receipt === "failed") failures.push(`Reverted transfer ${transfer.hash}`);
      if (receipt === "pending") {
        pending += 1;
        await broadcastPlayTransfer(transfer);
      }
    } catch {
      failures.push(`Transfer ${transfer.hash} needs reconciliation`);
    }
  }
  return { pending, failures };
}
