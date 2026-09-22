import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { PLAY_ENTRY_FEE_ETH } from "@/lib/game/play-player";
import { boardRpcFetch } from "@/server/lib/board-rpc-fetch";
import { playDataPath } from "@/server/lib/play-data-path";
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
    const parsed = JSON.parse(readFileSync(TREASURY_PATH, "utf8")) as TreasuryFile;
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

const treasury = loadTreasury();

export function getPlayTreasuryAddress(): Hex {
  return treasury.address;
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
export async function verifySitTransaction(input: {
  hash: Hex;
  from: Hex;
}): Promise<{ ok: true } | { ok: false; error: SitTxError }> {
  const client = publicClient();
  const expectedTo = treasury.address.toLowerCase();
  const expectedFrom = input.from.toLowerCase();

  let tx: Awaited<ReturnType<typeof client.getTransaction>> | null = null;
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null =
    null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const [nextTx, nextReceipt] = await Promise.all([
        withTimeout(client.getTransaction({ hash: input.hash }), 6_000),
        withTimeout(client.getTransactionReceipt({ hash: input.hash }), 6_000),
      ]);
      tx = nextTx;
      receipt = nextReceipt;
      if (tx && receipt) break;
    } catch {
      // RPC timeout or not indexed yet
    }
    await sleep(250);
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
        message: "Sit transaction does not pay the play treasury from this wallet.",
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

  return { ok: true };
}

type ExplorerTx = {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  isError?: string;
  txreceipt_status?: string;
};

/** Successful unused-candidate sit payments to the treasury, oldest first. */
export async function listSuccessfulSitHashes(from: Hex): Promise<Hex[]> {
  const url = `${getBoardExplorerUrl()}/api?module=account&action=txlist&address=${treasury.address}&sort=desc&page=1&offset=30`;
  const response = await boardRpcFetch(url);
  if (!response.ok) return [];
  const payload = (await response.json()) as { result?: ExplorerTx[] };
  const rows = Array.isArray(payload.result) ? payload.result : [];
  const fromKey = from.toLowerCase();
  const treasuryKey = treasury.address.toLowerCase();
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

export type RefundSitResult =
  | { ok: true; hash: Hex }
  | { ok: false; code: "INSUFFICIENT_FUNDS" | "SEND_FAILED"; message: string };

export async function getPlayTreasuryStatus() {
  const client = publicClient();
  try {
    const balance = await client.getBalance({ address: treasury.address });
    const fees = await client.estimateFeesPerGas();
    const zero = BigInt(0);
    const fallbackGas = BigInt(21_000);
    const maxFee = fees.maxFeePerGas ?? fees.gasPrice ?? zero;
    const gasCost = fallbackGas * maxFee;
    return {
      address: treasury.address,
      balanceWei: balance.toString(),
      balanceEth: formatEther(balance),
      canRefund: balance >= PLAY_SIT_VALUE + gasCost,
    };
  } catch {
    return {
      address: treasury.address,
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
export async function refundSit(to: Hex): Promise<RefundSitResult> {
  const account = privateKeyToAccount(treasury.privateKey);
  const public_ = publicClient();

  try {
    const balance = await public_.getBalance({ address: account.address });
    const fees = await public_.estimateFeesPerGas();
    const zero = BigInt(0);
    const fallbackGas = BigInt(21_000);
    const maxFee = fees.maxFeePerGas ?? fees.gasPrice ?? zero;
    const maxPriority = fees.maxPriorityFeePerGas ?? zero;
    const gas = await public_
      .estimateGas({
        account,
        to,
        value: PLAY_SIT_VALUE,
      })
      .catch(() => fallbackGas);

    const need = PLAY_SIT_VALUE + gas * maxFee;
    if (balance < need) {
      return {
        ok: false,
        code: "INSUFFICIENT_FUNDS",
        message:
          "House wallet needs a little extra ETH for gas. You can still leave; the 0.002 ETH refund is queued.",
      };
    }

    const wallet = createWalletClient({
      account,
      chain: getBoardChain(),
      transport: http(getBoardRpcUrl(), {
        fetchFn: boardRpcFetch,
        timeout: 12_000,
        retryCount: 1,
      }),
    });
    const hash = await wallet.sendTransaction({
      account,
      to,
      value: PLAY_SIT_VALUE,
      gas,
      ...(maxFee > zero
        ? { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority }
        : {}),
      chain: getBoardChain(),
    });
    try {
      await withTimeout(
        public_.waitForTransactionReceipt({ hash, timeout: 20_000 }),
        22_000,
      );
    } catch {
      // Broadcast succeeded; receipt lag should not fail the refund claim.
    }
    return { ok: true, hash };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Refund transaction failed.";
    if (/exceeds the balance|insufficient funds/i.test(message)) {
      return {
        ok: false,
        code: "INSUFFICIENT_FUNDS",
        message:
          "House wallet needs a little extra ETH for gas. You can still leave; the 0.002 ETH refund is queued.",
      };
    }
    return { ok: false, code: "SEND_FAILED", message };
  }
}
