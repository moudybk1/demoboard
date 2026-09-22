import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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
import { playDataPath } from "@/server/lib/play-data-path";
import {
  getPlayTreasuryAddress,
  listSuccessfulSitHashes,
  refundSit,
  sitWasRefunded,
  verifySitTransaction,
} from "@/server/lib/play-chain";
import { paidLeaveToken } from "@/server/lib/play-seat-token";
import { publishPlayTable } from "@/server/realtime/play-hub";

const STORE_PATH = playDataPath("play-tables.json");

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
  /** Wallets that forfeited the current match. They cannot sit this table again until a new match starts. */
  leftAddresses: string[];
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
    leftAddresses: (table.leftAddresses ?? []).map((row) => row.toLowerCase()),
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
    leftAddresses: [],
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
    healIdleLobby(table);
  }

  persistStore();
}

function persistStore() {
  const payload: Store = {
    tables: [...tables.values()],
    usedTx: [...usedTx],
    pendingRefunds: [...pendingRefunds],
  };
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, `${JSON.stringify(payload)}\n`);
  } catch (error) {
    console.error("[play-tables] could not persist store", error);
  }
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

function asLobby(table: PlayTable, viewer?: string | null): PlayLobbyGame {
  const viewerKey = viewer?.toLowerCase() ?? "";
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
    blocked: Boolean(viewerKey && (table.leftAddresses ?? []).includes(viewerKey)),
    seats: table.seats.map((seat) => ({
      address: seat.address,
      username: seat.username,
      seat: seat.seat,
    })),
  };
}

function leftThisTable(table: PlayTable, address: string) {
  if (!table.leftAddresses) table.leftAddresses = [];
  return table.leftAddresses.includes(address.toLowerCase());
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
  table.leftAddresses = [];
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
  const needle = address.toLowerCase();
  for (const table of tables.values()) {
    if (table.status === "cancelled") continue;
    const seat = table.seats.find((row) => row.address.toLowerCase() === needle);
    if (seat) return { table, seat };
  }
  return null;
}

function rememberLeaver(table: PlayTable, address: string) {
  if (!table.leftAddresses) table.leftAddresses = [];
  const leaver = address.toLowerCase();
  if (isPlayBot(leaver) || table.leftAddresses.includes(leaver)) return;
  table.leftAddresses.push(leaver);
}

/**
 * Drop a seat. Last human out resets a lobby slot to waiting and clears the
 * leave ban, so the same wallet can sit again and must pay the entry fee.
 */
function unseat(table: PlayTable, seat: PlaySeat, ban: boolean) {
  const index = table.seats.findIndex(
    (row) => row.leaveToken === seat.leaveToken || row.address === seat.address,
  );
  if (index >= 0) table.seats.splice(index, 1);
  if (ban) rememberLeaver(table, seat.address);
  if (humanSeatCount(table) === 0) {
    dropHouseNpcs(table);
    if (isPlayLobbySlotId(table.id)) {
      table.status = "waiting";
      table.leftAddresses = [];
    } else if (table.seats.length === 0) {
      table.status = "cancelled";
    }
  }
}

/** Empty waiting lobby slots are open to everyone, including a previous leaver. */
function healIdleLobby(table: PlayTable) {
  if (!isPlayLobbySlotId(table.id) || humanSeatCount(table) > 0) return false;
  let changed = false;
  if (table.seats.length > 0) {
    dropHouseNpcs(table);
    changed = true;
  }
  if (table.status !== "waiting") {
    table.status = "waiting";
    changed = true;
  }
  if ((table.leftAddresses ?? []).length > 0) {
    table.leftAddresses = [];
    changed = true;
  }
  return changed;
}

function leftoverFromLeftMatch(table: PlayTable, address: string) {
  return table.status === "playing" || leftThisTable(table, address);
}

function extraSitHash(seat: PlaySeat, txHash: Hex): Hex | null {
  if (!seat.sitTxHash || txHash === seat.sitTxHash || usedTx.has(txHash)) {
    return null;
  }
  return txHash;
}

async function refundVerifiedExtra(address: Hex, txHash: Hex) {
  const verified = await verifySitTransaction({ hash: txHash, from: address });
  if (!verified.ok) return false;
  await withLock(async () => {
    usedTx.add(txHash);
    persistStore();
  });
  queueRefund(address);
  void flushPendingRefunds();
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

export function listPlayLobby(viewer?: string | null): PlayLobbyGame[] {
  return PLAY_LOBBY_SLOTS.map((slot) => {
    const table = tables.get(slot.id) ?? newEmptySlot(slot);
    if (!tables.has(slot.id)) tables.set(slot.id, table);
    healIdleLobby(table);
    return asLobby(table, viewer);
  });
}

export type SitResult =
  | {
      ok: true;
      table: PlayTableView;
      seat: number;
      leaveToken: string;
      alreadySeated: boolean;
      txHash: Hex | null;
    }
  | {
      ok: false;
      code:
        | "BAD_TX"
        | "TX_USED"
        | "FULL"
        | "ALREADY_SEATED"
        | "NOT_FOUND"
        | "NOT_WAITING"
        | "LEFT_TABLE"
        | "NO_PAYMENT";
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
            txHash: found.seat.sitTxHash,
          },
        };
      }
      unseat(found.table, found.seat, leftoverFromLeftMatch(found.table, address));
      bump(found.table);
      return { kind: "pay" };
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
    if (early.extraTx) {
      void refundVerifiedExtra(address, early.extraTx);
    }
    return early.result;
  }

  const verified = await verifySitTransaction({
    hash: txHash,
    from: address,
    tableId: wantedId,
  });
  if (!verified.ok) {
    console.error("[play-sit] verify failed", txHash, verified.error.code, verified.error.message);
    return {
      ok: false,
      code: "BAD_TX",
      message: verified.error.message,
      refund: false,
    };
  }

  const result = await withLock(async (): Promise<SitResult> => {
    // Prefer reconnect before TX_USED so a lost response after a successful
    // seat still reopens the room on retry without charging again.
    const found = findActiveSeat(address);
    if (found) {
      const sameTable = !wantedId || found.table.id === wantedId;
      if (sameTable) {
        usedTx.add(txHash);
        persistStore();
        return {
          ok: true,
          table: asView(found.table),
          seat: found.seat.seat,
          leaveToken: found.seat.leaveToken,
          alreadySeated: true,
          txHash: found.seat.sitTxHash ?? txHash,
        };
      }
      unseat(found.table, found.seat, leftoverFromLeftMatch(found.table, address));
      bump(found.table);
    }

    if (usedTx.has(txHash)) {
      return {
        ok: false,
        code: "TX_USED",
        message: "This sit transaction was already used.",
        refund: false,
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
    if (leftThisTable(table, address)) {
      usedTx.add(txHash);
      persistStore();
      return {
        ok: false,
        code: "LEFT_TABLE",
        message:
          "You left this match. Sit a different waiting table. The entry fee is charged again.",
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

    const leaveToken = paidLeaveToken(txHash);
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
      txHash,
    };
  });

  // Never block the player on refund RPC. Queue and flush in the background.
  if (result.ok && result.alreadySeated) {
    queueRefund(address);
    void flushPendingRefunds();
    return result;
  }

  if (result.ok) {
    void flushPendingRefunds();
    return result;
  }

  if (result.refund) {
    queueRefund(address);
    void flushPendingRefunds();
  }

  return result;
}

/**
 * Seat a wallet that already paid 0.002 ETH but never got a room.
 * One payment opens the table. Any extra successful payments are refunded.
 */
export async function claimUnpaidSit(input: {
  game: GameType;
  tableId?: string;
  address: Hex;
}): Promise<SitResult> {
  const address = input.address.toLowerCase() as Hex;
  const wantedId = input.tableId?.toUpperCase();
  const already = await withLock(async () => {
    const found = findActiveSeat(address);
    if (!found) return null;
    const sameTable = !wantedId || found.table.id === wantedId;
    if (!sameTable) return null;
    return {
      ok: true as const,
      table: asView(found.table),
      seat: found.seat.seat,
      leaveToken: found.seat.leaveToken,
      alreadySeated: true,
      txHash: found.seat.sitTxHash,
    };
  });
  if (already) return already;

  const hashes = await listSuccessfulSitHashes(address);
  const open = hashes.filter((hash) => !usedTx.has(hash));
  if (open.length === 0) {
    return {
      ok: false,
      code: "NO_PAYMENT",
      message: "No confirmed sit payment found for this wallet.",
      refund: false,
    };
  }
  const [primary, ...extras] = open;
  const result = await sitPlayTable({
    game: input.game,
    tableId: input.tableId,
    address,
    txHash: primary!,
  });
  if (result.ok) {
    for (const extra of extras) {
      void refundVerifiedExtra(address, extra);
    }
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
      code: "NOT_FOUND" | "NOT_WAITING" | "NOT_PLAYING" | "FORBIDDEN" | "REFUND_FAILED";
      message: string;
    };

function normalizeAddress(raw: string | null | undefined): Hex | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(value) ? (value as Hex) : null;
}

function normalizeTx(raw: string | null | undefined): Hex | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return /^0x[a-f0-9]{64}$/.test(value) ? (value as Hex) : null;
}

/**
 * Put a paid wallet back into a waiting lobby slot on this instance.
 * The payment was already checked. Refuses a full table or a spent sit
 * that this instance already closed out.
 */
function adoptVerifiedSeat(tableId: string, address: Hex, txHash: Hex) {
  const table = tables.get(tableId);
  if (!table || table.status !== "waiting") return "closed" as const;
  if (table.seats.some((row) => row.address.toLowerCase() === address)) {
    return "ok" as const;
  }
  const token = paidLeaveToken(txHash);
  if (usedTx.has(txHash) && !table.seats.some((row) => row.leaveToken === token)) {
    return "used" as const;
  }
  if (table.seats.length >= MAX_PLAYERS_PER_ROOM) return "full" as const;
  const seat = nextFreeSeat(table);
  if (seat == null) return "full" as const;
  table.seats.push({
    address,
    username: shortenAddress(address),
    seat,
    sitTxHash: txHash,
    leaveToken: token,
    ready: false,
    refundTxHash: null,
  });
  fillHouseNpcs(table);
  usedTx.add(txHash);
  bump(table);
  return "ok" as const;
}

async function ensurePaidSeat(input: {
  tableId: string;
  leaveToken?: string;
  address?: string;
  txHash?: string;
}) {
  const tableId = input.tableId.toUpperCase();
  const txHash = normalizeTx(input.txHash);
  const address = normalizeAddress(input.address);
  const token = input.leaveToken?.trim().toLowerCase() ?? "";
  if (!txHash || !address || !token) return "skipped" as const;
  if (paidLeaveToken(txHash) !== token) return "skipped" as const;
  const table = tables.get(tableId);
  if (
    table?.seats.some(
      (row) => row.leaveToken === token || row.address.toLowerCase() === address,
    )
  ) {
    return "ok" as const;
  }
  const verified = await verifySitTransaction({
    hash: txHash,
    from: address,
    tableId,
  });
  if (!verified.ok) return "unverified" as const;
  if (await sitWasRefunded({ hash: txHash, from: address })) return "refunded" as const;
  return withLock(async () => adoptVerifiedSeat(tableId, address, txHash));
}

export type ResumePlayTableResult = {
  table: PlayTableView | null;
  note: string | null;
  /** Payment was refunded or already spent. Do not reopen a saved local seat. */
  blocked: boolean;
};

/** Rebuild a paid seat on whichever instance handled this request. */
export async function resumePlayTable(input: {
  tableId: string;
  leaveToken?: string;
  address?: string;
  txHash?: string;
}): Promise<ResumePlayTableResult> {
  const tableId = input.tableId.toUpperCase();
  if (!isPlayLobbySlotId(tableId) && !tables.has(tableId)) {
    return { table: null, note: null, blocked: false };
  }
  const outcome = await ensurePaidSeat(input);
  const table = tables.get(tableId);
  const note =
    outcome === "unverified"
      ? "Your sit payment is not on Robinhood Chain yet. Reload in a moment."
      : outcome === "refunded"
        ? "That sit fee was refunded. Sit again from the lobby."
        : outcome === "full"
          ? "That table is full. Pick another lobby."
          : outcome === "closed"
            ? "That table is already in play. Pick another lobby."
            : outcome === "used"
              ? "That sit payment was already used. Sit again from the lobby."
              : null;
  return {
    table: table ? asView(table) : null,
    note,
    blocked: outcome === "refunded" || outcome === "used",
  };
}

export async function readyPlayTable(input: {
  tableId: string;
  leaveToken: string;
  address?: string;
  txHash?: string;
}): Promise<TableActionResult> {
  const primed = await ensurePaidSeat(input);
  if (primed === "full" || primed === "closed" || primed === "used") {
    return {
      ok: false,
      code: primed === "full" ? "NOT_WAITING" : "FORBIDDEN",
      message:
        primed === "full"
          ? "That table is full. Pick another lobby."
          : primed === "closed"
            ? "That table is already in play. Pick another lobby."
            : "That sit payment was already used. Sit again from the lobby.",
    };
  }
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
  address?: string;
  txHash?: string;
}): Promise<TableActionResult> {
  await ensurePaidSeat(input);
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

/**
 * Quit a match that already started. Seat is cleared. Sit fee is not refunded.
 * Empty lobby slots reset so someone else can sit.
 */
export async function forfeitPlayTable(input: {
  tableId: string;
  leaveToken?: string;
  address?: string;
}): Promise<TableActionResult> {
  return withLock(async () => {
    const table = tables.get(input.tableId.toUpperCase());
    if (!table) {
      return { ok: false as const, code: "NOT_FOUND" as const, message: "Table not found." };
    }
    const token = input.leaveToken?.trim() ?? "";
    const address = input.address?.toLowerCase() ?? "";
    const index = table.seats.findIndex((row) => {
      if (token && row.leaveToken === token) return true;
      if (address && !isPlayBot(address) && row.address.toLowerCase() === address) {
        return true;
      }
      return false;
    });
    if (index < 0) {
      return {
        ok: false as const,
        code: "FORBIDDEN" as const,
        message: "This seat token does not match the table.",
      };
    }
    const seat = table.seats[index];
    if (!seat) {
      return {
        ok: false as const,
        code: "FORBIDDEN" as const,
        message: "This seat token does not match the table.",
      };
    }
    unseat(table, seat, true);
    bump(table);
    return { ok: true as const, table: asView(table) };
  });
}
