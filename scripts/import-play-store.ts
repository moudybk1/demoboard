import { readdir, readFile, lstat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { getBoardChainId } from "../src/lib/wallet/chains";
import { getPlayChainHead, getPlayTreasuryAddress } from "../src/server/lib/play-chain";
import { initializePlayDocuments } from "../src/server/lib/play-store";

async function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const source = option("--source-dir");
  const fresh = args.includes("--new-ledger");
  if (!process.env.DATABASE_URL || Boolean(source) === fresh)
    throw new Error("Inject DATABASE_URL and treasury/network settings. Choose --source-dir PATH or --new-ledger, and explicitly confirm chain and treasury.");
  const network = { chainId: getBoardChainId(), treasury: getPlayTreasuryAddress().toLowerCase() };
  if (option("--confirm-chain-id") !== String(network.chainId) || option("--confirm-treasury")?.toLowerCase() !== network.treasury)
    throw new Error("Confirm the source ledger's exact --confirm-chain-id and --confirm-treasury. Never relabel another network's funds.");
  const documents: Record<string, unknown> = {};
  if (source) {
    const directory = resolve(source);
    for (const name of await readdir(directory)) {
      if (!/^(play-tables|play-nonce-[a-zA-Z0-9_-]+|play-payout-[a-zA-Z0-9_-]+)\.json$/.test(name)) continue;
      const path = join(directory, name);
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error("Only regular financial document files may be imported.");
      documents[name.slice(0, -5)] = JSON.parse(await readFile(path, "utf8"));
    }
    if (!documents["play-tables"]) throw new Error("Source has no play-tables.json; nothing was imported.");
  } else documents["play-tables"] = { tables: [], usedTx: [], matches: {}, pendingRefunds: [] };
  const tables = documents["play-tables"] as { tables?: unknown[]; usedTx?: unknown[]; network?: typeof network; entryCutoverBlock?: string };
  if (!Array.isArray(tables.tables) || !Array.isArray(tables.usedTx)) throw new Error("Invalid source ledger shape; nothing was imported.");
  if (tables.network && (tables.network.chainId !== network.chainId || tables.network.treasury.toLowerCase() !== network.treasury))
    throw new Error("Source network/treasury mismatch; nothing was imported.");
  tables.network = network;
  // Historical hashes remain consumed/recoverable via their imported records.
  // Unknown old hashes are never treated as a new payment after this cutover.
  tables.entryCutoverBlock = ((await getPlayChainHead()) + BigInt(1)).toString();
  await initializePlayDocuments(documents);
  console.info(`Imported ${Object.keys(documents).length} financial documents atomically; preserved ${tables.usedTx.length} consumed payment records. No transfers were broadcast. Review legacy refund holds before starting the worker.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : "Import failed."); process.exit(1);
});
