import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { playDataDir, playDataPath } from "@/server/lib/play-data-path";

/** Serialize read/modify/write across workers. Production requires shared Postgres. */
export async function withPlayDocument<T, R>(
  key: string,
  initial: () => T,
  run: (document: T) => Promise<R>,
): Promise<R> {
  if (!/^[a-zA-Z0-9_-]+$/.test(key))
    throw new Error("Invalid play document key.");
  if (process.env.DATABASE_URL) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const attempt = await getDb().transaction(async (tx) => {
        // Contended locks must not retain scarce pooled connections.
        const [lock] = await tx.execute(sql`select pg_try_advisory_xact_lock(hashtext(${`play:${key}`})) as locked`);
        if (!lock.locked) return { busy: true as const };
        const rows = await tx.execute(sql`select value from play_documents where key = ${key}`);
        if (!rows[0] && key === "play-tables")
          throw new Error("Paid ledger is not initialized. Stop entry and import/reconcile the previous store before starting the worker.");
        const document = rows[0] ? (rows[0].value as T) : initial();
        const result = await run(document);
        await tx.execute(sql`insert into play_documents (key, value) values (${key}, ${JSON.stringify(document)}::jsonb)
          on conflict (key) do update set value = excluded.value`);
        return { busy: false as const, result };
      });
      if (!attempt.busy) return attempt.result;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Timed out acquiring play document ${key}. Retry safely.`);
  }
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  ) {
    throw new Error(
      "Paid play requires DATABASE_URL and the play_documents migration.",
    );
  }
  await mkdir(playDataDir(), { recursive: true });
  const path = playDataPath(`${key}.json`);
  const lock = `${path}.lock`;
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      await mkdir(lock);
      await writeFile(`${lock}/owner`, String(process.pid));
      break;
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST" ||
        Date.now() > deadline
      )
        throw error;
      try {
        const owner = Number(await readFile(`${lock}/owner`, "utf8"));
        if (Number.isSafeInteger(owner) && owner > 0) {
          try {
            process.kill(owner, 0);
          } catch (probe) {
            if ((probe as NodeJS.ErrnoException).code === "ESRCH")
              await rm(lock, { recursive: true, force: true });
          }
        }
      } catch (probe) {
        // A process may have died between creating the lock and writing its PID.
        if ((probe as NodeJS.ErrnoException).code === "ENOENT") {
          const info = await stat(lock).catch(() => null);
          if (info && Date.now() - info.mtimeMs > 30_000)
            await rm(lock, { recursive: true, force: true });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  try {
    let document: T;
    try {
      document = JSON.parse(await readFile(path, "utf8")) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      document = initial();
    }
    const result = await run(document);
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(document), { mode: 0o600 });
    await rename(temporary, path);
    return result;
  } finally {
    await rm(lock, { recursive: true });
  }
}

/** Explicit operator cutover only. Never overwrite an existing financial document. */
export async function initializePlayDocuments(documents: Record<string, unknown>) {
  if (!documents["play-tables"]) throw new Error("A paid table ledger is required.");
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('play:store-initialization'))`);
    for (const [key, value] of Object.entries(documents)) {
      if (!/^(play-tables|play-nonce-[a-zA-Z0-9_-]+|play-payout-[a-zA-Z0-9_-]+)$/.test(key))
        throw new Error("Unexpected financial document name.");
      const rows = await tx.execute(sql`select key from play_documents where key = ${key}`);
      if (rows.length) throw new Error(`Refusing to overwrite existing ${key}. Reconcile the ledgers first.`);
      await tx.execute(sql`insert into play_documents (key, value) values (${key}, ${JSON.stringify(value)}::jsonb)`);
    }
  });
}
