import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import type { Hex } from "viem";

import { createMonopolyMatchForSeats } from "@/lib/game/monopoly-rules";
import { createLudoMatchForSeats } from "@/lib/mock/ludo";
import { PLAY_ENTRY_FEE } from "@/lib/game/play-player";
import {
  isPlayBot,
  isPlayLobbySlotId,
  PLAY_HOUSE_NPCS,
  PLAY_LOBBY_SLOTS,
  type PlayLobbyGame,
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
  address: string;
  username: string;
  seat: number;
  sitTxHash: Hex | null;
  leaveToken: string;
  ready: boolean;
  refundTxHash: Hex | null;
};

type PlayTable = {
  id: string;
  game: GameType;
  label: string;
  slot: number;
  status: PlayTableStatus;
  seats: PlaySeat[];
  version: number;
};

type PendingRefund = {
  address: Hex;
  createdAt: number;
};

type Store = {
  tables: PlayTable[];
  usedTx: string[];
  pendingRefunds?: PendingRefund[];
};

const usedTx = new Set<string>();
const tables = new Map<string, PlayTable>();
const pendingRefunds: PendingRefund[] = [];

function loadStore() {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
    for (const table of parsed.tables ?? []) {
      tables.set(table.id.toUpperCase(), hydrateTable(table));
    }
    for (const hash of parsed.usedTx ?? []) usedTx.add(hash.toLowerCase());
    for (const refund of parsed.pendingRefunds ?? []) {
      pendingRefunds.push({
        address: refund.address.toLowerCase() as Hex,
        createdAt: refund.createdAt,
      });
    }
  } catch {
    // first run
  }
  ensureLobbySlots();
}

function slotMeta(tableId: string) {
  const id = tableId.toUpperCase();
  return PLAY_LOBBY_SLOTS.find((slot) => slot.id === id);
}

function hydrateTable(table: PlayTable): PlayTable {
  const slot = slotMeta(table.id);
  return {
    ...table,
    id: table.id.toUpperCase(),
    label: table.label ?? slot?.label ?? table.id,
    slot: table.slot ?? slot?.slot ?? 0,
  };
}

function newEmptySlot(slot: (typeof PLAY_LOBBY_SLOTS)[number]): PlayTable {
  return {
    id: slot.id,
    game: slot.game,
    label: slot.label,
    slot: slot.slot,
    status: "waiting",
    seats: [],
    version: 0,
  };
}

function ensureLobbySlots() {
  const orphans: PlayTable[] = [];
  for (const table of tables.values()) {
    if (!isPlayLobbySlotId(table.id)) orphans.push(table);
  }

  for (const slot of PLAY_LOBBY_SLOTS) {
    if (!tables.has(slot.id)) tables.set(slot.id, newEmptySlot(slot));
  }

  for (const orphan of orphans) {
    if (orphan.status === "waiting" && orphan.seats.length > 0) {
      const target = [...tables.values()].find(
        (table) =>
          table.game === orphan.game &&
          isPlayLobbySlotId(table.id) &&
          table.status === "waiting" &&
          table.seats.length === 0,
      );
      if (target) {
        target.seats = orphan.seats;
        target.version += 1;
      }
    }
    tables.delete(orphan.id.toUpperCase());
  }

  for (const table of tables.values()) {
    if (table.status === "waiting" && humanSeatCount(table) === 0) {
      dropHouseNpcs(table);
    }
  }

  persistStore();
}

function persistStore() {
  const payload: Store = {
    tables: [...tables.values()],
    usedTx: [...usedTx],
    pendingRefunds: [...pendingRefunds],
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

let chainQueue: Promise<void> = Promise.resolve();

function withChainLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chainQueue.then(fn, fn);
  chainQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function newLeaveToken() {
  return randomBytes(18).toString("hex");
}

function asView(table: PlayTable): PlayTableView {
  return {
    id: table.id,
    game: table.game,
    label: table.label,
    slot: table.slot,
    status: table.status,
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    seats: table.seats.map((seat) => ({
      address: seat.address,
      username: seat.username,
      seat: seat.seat,
      ready: seat.ready,
    })),
    refundTxHash:
      table.seats.find((seat) => seat.refundTxHash)?.refundTxHash ?? null,
    version: table.version,
  };
}

function asLobby(table: PlayTable): PlayLobbyGame {
  return {
    tableId: table.id,
    game: table.game,
    label: table.label,
    slot: table.slot,
    status: table.status,
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    seated: table.seats.length,
    seatsLeft: MAX_PLAYERS_PER_ROOM - table.seats.length,
    seats: table.seats.map((seat) => ({
      address: seat.address,
      username: seat.username,
      seat: seat.seat,
    })),
  };
}

function bump(table: PlayTable) {
  table.version += 1;
  persistStore();
  publishPlayTable({ type: "table", table: asView(table) });
}

function queueRefund(address: Hex) {
  const already = pendingRefunds.some((row) => row.address === address);
  if (already) return;
  pendingRefunds.push({ address, createdAt: Date.now() });
  persistStore();
}

async function flushPendingRefunds() {
  if (pendingRefunds.length === 0) return;
  await withChainLock(async () => {
    const leftover: PendingRefund[] = [];
    for (const pending of pendingRefunds) {
      const result = await refundSit(pending.address);
      if (!result.ok) leftover.push(pending);
    }
    pendingRefunds.splice(0, pendingRefunds.length, ...leftover);
    persistStore();
  });
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

function nextFreeSeat(table: PlayTable): number | null {
  const taken = new Set(table.seats.map((seat) => seat.seat));
  for (let seat = 1; seat <= MAX_PLAYERS_PER_ROOM; seat += 1) {
    if (!taken.has(seat)) return seat;
  }
  return null;
}

/** Fill leftover waiting seats with ready house NPCs. Humans keep their seats. */
function fillHouseNpcs(table: PlayTable) {
  const takenIds = new Set(table.seats.map((seat) => seat.address.toLowerCase()));
  for (const npc of PLAY_HOUSE_NPCS) {
    if (table.seats.length >= MAX_PLAYERS_PER_ROOM) return;
    if (takenIds.has(npc.id)) continue;
    const seat = nextFreeSeat(table);
    if (seat == null) return;
    table.seats.push({
      address: npc.id,
      username: npc.username,
      seat,
      sitTxHash: null,
      leaveToken: newLeaveToken(),
      ready: true,
      refundTxHash: null,
    });
    takenIds.add(npc.id);
  }
}

function humanSeatCount(table: PlayTable) {
  return table.seats.filter((seat) => !isPlayBot(seat.address)).length;
}

function dropHouseNpcs(table: PlayTable) {
  table.seats = table.seats.filter((seat) => !isPlayBot(seat.address));
}

function findActiveSeat(address: Hex): { table: PlayTable; seat: PlaySeat } | null {
  for (const table of tables.values()) {
    if (table.status === "cancelled") continue;
    const seat = table.seats.find((row) => row.address === address);
    if (seat) return { table, seat };
  }
  return null;
}

function alreadySeatedMessage(table: PlayTable) {
  return table.status === "playing"
    ? "You already have a seat in a match. Return to that table."
    : "You already have a seat at another waiting table. Leave it first.";
}

function extraSitHash(seat: PlaySeat, txHash: Hex): Hex | null {
  if (!seat.sitTxHash || txHash === seat.sitTxHash || usedTx.has(txHash)) {
    return null;
  }
  return txHash;
}

async function settleRefund(address: Hex) {
  await withChainLock(async () => {
    const refund = await refundSit(address);
    if (!refund.ok) queueRefund(address);
  });
}

async function refundVerifiedExtra(address: Hex, txHash: Hex) {
  const verified = await verifySitTransaction({ hash: txHash, from: address });
  if (!verified.ok) return false;
  await withLock(async () => {
    usedTx.add(txHash);
    persistStore();
  });
  await settleRefund(address);
  return true;
}

export function getPlayConfig() {
  void flushPendingRefunds();
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

export function listPlayLobby(): PlayLobbyGame[] {
  return PLAY_LOBBY_SLOTS.map((slot) => {
    const table = tables.get(slot.id) ?? newEmptySlot(slot);
    return asLobby(table);
  });
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
      code: "BAD_TX" | "TX_USED" | "FULL" | "ALREADY_SEATED" | "NOT_FOUND" | "NOT_WAITING";
      message: string;
      refund?: boolean;
    };

export async function sitPlayTable(input: {
  game: GameType;
  tableId?: string;
  address: Hex;
  txHash: Hex;
}): Promise<SitResult> {
  const address = input.address.toLowerCase() as Hex;
  const txHash = input.txHash.toLowerCase() as Hex;
  const wantedId = input.tableId?.toUpperCase();

  type Early =
    | { kind: "reconnect"; result: Extract<SitResult, { ok: true }>; extraTx: Hex | null }
    | { kind: "blocked"; result: Extract<SitResult, { ok: false }>; extraTx: Hex | null }
    | { kind: "pay" };

  const early = await withLock(async (): Promise<Early> => {
    const found = findActiveSeat(address);
    if (found) {
      const extraTx = extraSitHash(found.seat, txHash);
      const sameTable = !wantedId || found.table.id === wantedId;
      if (sameTable) {
        return {
          kind: "reconnect",
          extraTx,
          result: {
            ok: true,
            table: asView(found.table),
            seat: found.seat.seat,
            leaveToken: found.seat.leaveToken,
            alreadySeated: true,
          },
        };
      }
      return {
        kind: "blocked",
        extraTx,
        result: {
          ok: false,
          code: "ALREADY_SEATED",
          message: alreadySeatedMessage(found.table),
          refund: Boolean(extraTx),
        },
      };
    }
    if (usedTx.has(txHash)) {
      return {
        kind: "blocked",
        extraTx: null,
        result: {
          ok: false,
          code: "TX_USED",
          message: "This sit transaction was already used.",
          refund: false,
        },
      };
    }
    return { kind: "pay" };
  });

  if (early.kind !== "pay") {
    let refunded = false;
    if (early.extraTx) {
      refunded = await refundVerifiedExtra(address, early.extraTx);
    }
    if (early.kind === "blocked" && early.result.code === "ALREADY_SEATED") {
      return { ...early.result, refund: refunded };
    }
    return early.result;
  }

  const verified = await verifySitTransaction({ hash: txHash, from: address });
  if (!verified.ok) {
    return {
      ok: false,
      code: "BAD_TX",
      message: verified.error.message,
      refund: false,
    };
  }

  const result = await withLock(async (): Promise<SitResult> => {
    if (usedTx.has(txHash)) {
      return {
        ok: false,
        code: "TX_USED",
        message: "This sit transaction was already used.",
        refund: false,
      };
    }

    const found = findActiveSeat(address);
    if (found) {
      usedTx.add(txHash);
      persistStore();
      const sameTable = !wantedId || found.table.id === wantedId;
      if (sameTable) {
        return {
          ok: true,
          table: asView(found.table),
          seat: found.seat.seat,
          leaveToken: found.seat.leaveToken,
          alreadySeated: true,
        };
      }
      return {
        ok: false,
        code: "ALREADY_SEATED",
        message: alreadySeatedMessage(found.table),
        refund: true,
      };
    }

    const table = wantedId
      ? tables.get(wantedId)
      : [...tables.values()].find(
          (row) =>
            row.game === input.game &&
            row.status === "waiting" &&
            row.seats.length < MAX_PLAYERS_PER_ROOM,
        );

    if (!table) {
      usedTx.add(txHash);
      persistStore();
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "That lobby table was not found.",
        refund: true,
      };
    }
    if (table.game !== input.game) {
      usedTx.add(txHash);
      persistStore();
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "That table is not this game.",
        refund: true,
      };
    }
    if (table.status !== "waiting") {
      usedTx.add(txHash);
      persistStore();
      return {
        ok: false,
        code: "NOT_WAITING",
        message: "That table is already in play. Pick another lobby.",
        refund: true,
      };
    }
    if (table.seats.length >= MAX_PLAYERS_PER_ROOM) {
      usedTx.add(txHash);
      persistStore();
      return {
        ok: false,
        code: "FULL",
        message: "Table is full.",
        refund: true,
      };
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
    fillHouseNpcs(table);
    usedTx.add(txHash);
    bump(table);

    return {
      ok: true,
      table: asView(table),
      seat,
      leaveToken,
      alreadySeated: false,
    };
  });

  if (result.ok && result.alreadySeated) {
    await settleRefund(address);
    return result;
  }

  if (result.ok) {
    void flushPendingRefunds();
    return result;
  }

  if (result.refund) {
    await settleRefund(address);
  }

  return result;
}

export type TableActionResult =
  | {
      ok: true;
      table: PlayTableView;
      refundTxHash?: Hex;
      refundPending?: boolean;
    }
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
    fillHouseNpcs(table);
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
  const prepared = await withLock(async () => {
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
    table.seats.splice(index, 1);
    if (humanSeatCount(table) === 0) {
      dropHouseNpcs(table);
    } else {
      fillHouseNpcs(table);
    }
    if (table.seats.length === 0 && !isPlayLobbySlotId(table.id)) {
      table.status = "cancelled";
    }
    bump(table);
    return {
      ok: true as const,
      table: asView(table),
      address: seat.address,
    };
  });

  if (!prepared.ok) return prepared;

  if (isPlayBot(prepared.address)) {
    return { ok: true, table: prepared.table };
  }

  const refund = await withChainLock(async () => {
    const result = await refundSit(prepared.address as Hex);
    if (!result.ok) queueRefund(prepared.address as Hex);
    return result;
  });
  if (refund.ok) {
    void flushPendingRefunds();
    return {
      ok: true,
      table: prepared.table,
      refundTxHash: refund.hash,
      refundPending: false,
    };
  }

  return {
    ok: true,
    table: prepared.table,
    refundPending: true,
  };
}
