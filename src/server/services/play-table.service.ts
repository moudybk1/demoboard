import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import type { Hex } from "viem";

import { createMonopolyMatchForSeats } from "@/lib/game/monopoly-rules";
import { createLudoMatchForSeats } from "@/lib/mock/ludo";
import { PLAY_ENTRY_FEE } from "@/lib/game/play-player";
import {
  type PlayTableStatus,
  type PlayTableView,
} from "@/lib/game/play-table";
import { shortenAddress } from "@/lib/wallet/chains";
import type { GameType } from "@/lib/types";
import { MAX_PLAYERS_PER_ROOM } from "@/lib/types";
import {
  getPlayTreasuryAddress,
  refundSit,
  verifySitTransaction,
} from "@/server/lib/play-chain";
import { publishPlayTable } from "@/server/realtime/play-hub";

const STORE_PATH = join(process.cwd(), ".data", "play-tables.json");

type PlaySeat = {
  address: Hex;
  username: string;
  seat: number;
  sitTxHash: Hex;
  leaveToken: string;
  ready: boolean;
  refundTxHash: Hex | null;
};

type PlayTable = {
  id: string;
  game: GameType;
  status: PlayTableStatus;
  seats: PlaySeat[];
  version: number;
};

type Store = {
  tables: PlayTable[];
  usedTx: string[];
};

const usedTx = new Set<string>();
const tables = new Map<string, PlayTable>();

function loadStore() {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
    for (const table of parsed.tables ?? []) {
      tables.set(table.id.toUpperCase(), table);
    }
    for (const hash of parsed.usedTx ?? []) usedTx.add(hash.toLowerCase());
  } catch {
    // first run
  }
}

function persistStore() {
  const payload: Store = {
    tables: [...tables.values()],
    usedTx: [...usedTx],
  };
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, `${JSON.stringify(payload)}\n`);
}

loadStore();

let queue: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function newTableId(game: GameType) {
  const prefix = game === "ludo" ? "LUD" : "MNP";
  const stamp = Date.now().toString(36).slice(-6).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

function newLeaveToken() {
  return randomBytes(18).toString("hex");
}

function asView(table: PlayTable): PlayTableView {
  return {
    id: table.id,
    game: table.game,
    status: table.status,
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    seats: table.seats.map((seat) => ({
      address: seat.address,
      username: seat.username,
      seat: seat.seat,
      ready: seat.ready,
    })),
    refundTxHash: table.seats.find((seat) => seat.refundTxHash)?.refundTxHash ?? null,
    version: table.version,
  };
}

function bump(table: PlayTable) {
  table.version += 1;
  persistStore();
  publishPlayTable({ type: "table", table: asView(table) });
}

function findOpenTable(game: GameType) {
  for (const table of tables.values()) {
    if (
      table.game === game &&
      table.status === "waiting" &&
      table.seats.length < MAX_PLAYERS_PER_ROOM
    ) {
      return table;
    }
  }
  return null;
}

function startMatch(table: PlayTable) {
  table.status = "playing";
  const seats = table.seats.map((seat) => ({
    id: seat.address,
    username: seat.username,
    seat: seat.seat,
  }));
  if (table.game === "monopoly") {
    createMonopolyMatchForSeats(table.id, seats);
  } else {
    createLudoMatchForSeats(table.id, seats);
  }
}

export function getPlayConfig() {
  return {
    treasury: getPlayTreasuryAddress(),
    entryFee: PLAY_ENTRY_FEE,
    entryFeeWei: PLAY_ENTRY_FEE.toString(),
  };
}

export function getPlayTable(tableId: string): PlayTableView | null {
  const table = tables.get(tableId.toUpperCase());
  return table ? asView(table) : null;
}

export type SitResult =
  | {
      ok: true;
      table: PlayTableView;
      seat: number;
      leaveToken: string;
      alreadySeated: boolean;
    }
  | {
      ok: false;
      code: "BAD_TX" | "TX_USED" | "FULL" | "ALREADY_SEATED";
      message: string;
    };

export async function sitPlayTable(input: {
  game: GameType;
  address: Hex;
  txHash: Hex;
}): Promise<SitResult> {
  return withLock(async () => {
    const address = input.address.toLowerCase() as Hex;
    const txHash = input.txHash.toLowerCase() as Hex;

    for (const table of tables.values()) {
      if (table.status !== "waiting") continue;
      const existing = table.seats.find((seat) => seat.address === address);
      if (existing && table.game === input.game) {
        return {
          ok: true as const,
          table: asView(table),
          seat: existing.seat,
          leaveToken: existing.leaveToken,
          alreadySeated: true,
        };
      }
      if (existing) {
        return {
          ok: false as const,
          code: "ALREADY_SEATED" as const,
          message: "You already have a seat at another waiting table. Leave it first.",
        };
      }
    }

    if (usedTx.has(txHash)) {
      return {
        ok: false as const,
        code: "TX_USED" as const,
        message: "This sit transaction was already used.",
      };
    }

    const verified = await verifySitTransaction({ hash: txHash, from: address });
    if (!verified.ok) {
      return {
        ok: false as const,
        code: "BAD_TX" as const,
        message: verified.error.message,
      };
    }

    let table = findOpenTable(input.game);
    if (!table) {
      table = {
        id: newTableId(input.game),
        game: input.game,
        status: "waiting",
        seats: [],
        version: 0,
      };
      tables.set(table.id.toUpperCase(), table);
    }

    if (table.seats.length >= MAX_PLAYERS_PER_ROOM) {
      try {
        await refundSit(address);
      } catch (error) {
        console.error("[play-table] refund after full table failed", error);
      }
      return { ok: false as const, code: "FULL" as const, message: "Table is full." };
    }

    const taken = new Set(table.seats.map((seat) => seat.seat));
    let seat = 1;
    while (taken.has(seat) && seat <= MAX_PLAYERS_PER_ROOM) seat += 1;

    const leaveToken = newLeaveToken();
    table.seats.push({
      address,
      username: shortenAddress(address),
      seat,
      sitTxHash: txHash,
      leaveToken,
      ready: false,
      refundTxHash: null,
    });
    usedTx.add(txHash);
    bump(table);

    return {
      ok: true as const,
      table: asView(table),
      seat,
      leaveToken,
      alreadySeated: false,
    };
  });
}

export type TableActionResult =
  | { ok: true; table: PlayTableView; refundTxHash?: Hex }
  | {
      ok: false;
      code: "NOT_FOUND" | "NOT_WAITING" | "FORBIDDEN" | "REFUND_FAILED";
      message: string;
    };

export async function readyPlayTable(input: {
  tableId: string;
  leaveToken: string;
}): Promise<TableActionResult> {
  return withLock(async () => {
    const table = tables.get(input.tableId.toUpperCase());
    if (!table) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "Table not found." };
    }
    if (table.status !== "waiting") {
      return {
        ok: false as const,
        code: "NOT_WAITING" as const,
        message: "The match already started.",
      };
    }
    const seat = table.seats.find((row) => row.leaveToken === input.leaveToken);
    if (!seat) {
      return {
        ok: false as const,
        code: "FORBIDDEN" as const,
        message: "This seat token does not match the table.",
      };
    }
    seat.ready = true;
    const filled = table.seats.length >= MAX_PLAYERS_PER_ROOM;
    const allReady = table.seats.every((row) => row.ready);
    if (filled && allReady) startMatch(table);
    bump(table);
    return { ok: true as const, table: asView(table) };
  });
}

export async function leavePlayTable(input: {
  tableId: string;
  leaveToken: string;
}): Promise<TableActionResult> {
  return withLock(async () => {
    const table = tables.get(input.tableId.toUpperCase());
    if (!table) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "Table not found." };
    }
    if (table.status !== "waiting") {
      return {
        ok: false as const,
        code: "NOT_WAITING" as const,
        message: "The match already started. Entry is locked.",
      };
    }
    const index = table.seats.findIndex((row) => row.leaveToken === input.leaveToken);
    if (index < 0) {
      return {
        ok: false as const,
        code: "FORBIDDEN" as const,
        message: "This seat token does not match the table.",
      };
    }
    const seat = table.seats[index];
    try {
      const refundTxHash = await refundSit(seat.address);
      seat.refundTxHash = refundTxHash;
      table.seats.splice(index, 1);
      if (table.seats.length === 0) table.status = "cancelled";
      bump(table);
      return { ok: true as const, table: asView(table), refundTxHash };
    } catch (error) {
      console.error("[play-table] refund failed", error);
      return {
        ok: false as const,
        code: "REFUND_FAILED" as const,
        message:
          "Could not refund 0.002 ETH. Faucet the play treasury for gas and try again.",
      };
    }
  });
}
