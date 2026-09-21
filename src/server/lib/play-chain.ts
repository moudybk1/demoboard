import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
import {
  getBoardChain,
  getBoardChainId,
  getBoardRpcUrl,
} from "@/lib/wallet/chains";

const TREASURY_PATH = join(process.cwd(), ".data", "play-treasury.json");

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
  writeTreasuryFile(created);
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
    transport: http(getBoardRpcUrl()),
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SitTxError = {
  code: "TX_NOT_FOUND" | "TX_FAILED" | "TX_MISMATCH";
  message: string;
};

/**
 * Confirm a sit payment: successful native transfer of the entry fee from the
 * player to the play treasury on the active Robinhood chain.
 */
export async function verifySitTransaction(input: {
  hash: Hex;
  from: Hex;
}): Promise<{ ok: true } | { ok: false; error: SitTxError }> {
  const client = publicClient();
  const expectedTo = treasury.address.toLowerCase();
  const expectedFrom = input.from.toLowerCase();

  let tx = null;
  let receipt = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      tx = await client.getTransaction({ hash: input.hash });
      receipt = await client.getTransactionReceipt({ hash: input.hash });
      if (tx && receipt) break;
    } catch {
      // not yet indexed
    }
    await sleep(400);
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
      transport: http(getBoardRpcUrl()),
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
    await public_.waitForTransactionReceipt({ hash });
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
