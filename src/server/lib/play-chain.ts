import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  createPublicClient,
  createWalletClient,
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

export async function refundSit(to: Hex): Promise<Hex> {
  const account = privateKeyToAccount(treasury.privateKey);
  const client = createWalletClient({
    account,
    chain: getBoardChain(),
    transport: http(getBoardRpcUrl()),
  });
  const hash = await client.sendTransaction({
    account,
    to,
    value: PLAY_SIT_VALUE,
    chain: getBoardChain(),
  });
  const public_ = publicClient();
  await public_.waitForTransactionReceipt({ hash });
  return hash;
}
