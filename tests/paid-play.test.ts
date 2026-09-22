import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import postgres from "postgres";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  keccak256,
  parseEther,
  parseTransaction,
  stringToHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  createLiveMatch,
  applyMatchAction,
  tickMatch,
} from "../src/server/services/play-match-engine";
import type { LiveMatch } from "../src/lib/game/live-match";
import { enabledPlayGame, isGameEnabled } from "../src/lib/game-availability";

const account = privateKeyToAccount(`0x${"11".repeat(32)}`);
const rival = privateKeyToAccount(`0x${"22".repeat(32)}`);
const seats = [account, rival].map((p, i) => ({
  id: p.address.toLowerCase(),
  username: `Player ${i + 1}`,
  seat: i + 1,
}));
const fixture = (game: "monopoly" | "ludo") =>
  createLiveMatch({
    roomId: game === "ludo" ? "LUD-1" : "MNP-1",
    game,
    seats,
    fundedSeats: 2,
  });
let root: string;
const cwd = process.cwd();
let store: typeof import("../src/server/lib/play-store");
let service: typeof import("../src/server/services/play-table.service");
let settlement: typeof import("../src/server/services/play-settlement.service");
let routes: typeof import("../src/server/lib/paid-game-route");
let auth: typeof import("../src/server/services/wallet-auth.service");
let token: string;
let receiptStatus: "pending" | "success" | "reverted" = "pending";
const sent: Hex[] = [];
const entryTransactions = new Map<
  string,
  { from: string; to: string; input: Hex; value: Hex; chainId: Hex }
>();
const originalFetch = globalThis.fetch;
const testPort = Number(process.env.BOARD_TEST_PG_PORT);
const databaseMode = Number.isInteger(testPort) && testPort > 1024 && testPort < 65536;
const testDatabaseName = `board_paid_test_${process.pid}`;
let testAdmin: ReturnType<typeof postgres> | undefined;

before(async () => {
  root = await mkdtemp(join(tmpdir(), "board-paid-play-test-"));
  process.chdir(root);
  delete process.env.DATABASE_URL;
  process.env.NEXT_PUBLIC_CHAIN_ENV = "testnet";
  if (databaseMode) {
    const url = `postgresql://127.0.0.1:${testPort}`;
    testAdmin = postgres(`${url}/postgres`, { max: 1 });
    await testAdmin.unsafe(`CREATE DATABASE ${testDatabaseName}`);
    process.env.DATABASE_URL = `${url}/${testDatabaseName}`;
    const database = postgres(process.env.DATABASE_URL, { max: 1 });
    try {
      for (const file of (await readdir(join(cwd, "drizzle"))).filter((file) => /^\d+.*\.sql$/.test(file)).sort()) {
        for (const statement of (await readFile(join(cwd, "drizzle", file), "utf8")).split("--> statement-breakpoint"))
          if (statement.trim()) await database.unsafe(statement);
      }
      await database`insert into play_documents (key, value) values ('play-tables', '{"tables":[],"usedTx":[],"entryCutoverBlock":"1"}'::jsonb)`;
    } finally { await database.end(); }
  }
  delete process.env.VERCEL;
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  delete process.env.PLAY_TREASURY_PRIVATE_KEY;
  process.env.NEXT_PUBLIC_RPC_URL = "http://127.0.0.1:1/test-rpc";
  // No request can leave this test process, and no transaction reaches a chain.
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as {
      id: number;
      method: string;
      params: Hex[];
    };
    const hash = body.params?.[0] ?? "0x";
    let result: unknown;
    switch (body.method) {
      case "eth_getTransaction":
      case "eth_getTransactionByHash":
        result = entryTransactions.has(hash)
          ? {
              ...entryTransactions.get(hash),
              hash,
              nonce: "0x0",
              gas: "0x5208",
              blockNumber: "0x10",
              blockHash: `0x${"00".repeat(32)}`,
              transactionIndex: "0x0",
              type: "0x2",
            }
          : null;
        break;
      case "eth_getTransactionCount":
        result = "0x0";
        break;
      case "eth_getBalance":
        result = `0x${parseEther("100").toString(16)}`;
        break;
      case "eth_estimateGas":
        result = "0x5208";
        break;
      case "eth_chainId":
        result = "0x723d";
        break;
      case "eth_gasPrice":
      case "eth_maxPriorityFeePerGas":
        result = "0x3b9aca00";
        break;
      case "eth_getBlockByNumber":
        result = {
          number: "0x10",
          baseFeePerGas: "0x3b9aca00",
          gasLimit: "0x1c9c380",
          gasUsed: "0x0",
          timestamp: "0x1",
          transactions: [],
          hash: `0x${"00".repeat(32)}`,
        };
        break;
      case "eth_blockNumber":
        result = "0x10";
        break;
      case "eth_sendRawTransaction":
        sent.push(hash);
        result = keccak256(hash);
        break;
      case "eth_getTransactionReceipt":
        result =
          receiptStatus === "pending"
            ? null
            : {
                transactionHash: hash,
                blockHash: `0x${"00".repeat(32)}`,
                blockNumber: "0x10",
                transactionIndex: "0x0",
                from: account.address,
                to: account.address,
                status: receiptStatus === "success" ? "0x1" : "0x0",
                cumulativeGasUsed: "0x5208",
                gasUsed: "0x5208",
                effectiveGasPrice: "0x3b9aca00",
                logs: [],
                type: "0x2",
              };
        break;
      default:
        throw new Error(`Unexpected test RPC: ${body.method}`);
    }
    return Response.json({ jsonrpc: "2.0", id: body.id, result });
  };
  store = await import("../src/server/lib/play-store");
  service = await import("../src/server/services/play-table.service");
  settlement = await import("../src/server/services/play-settlement.service");
  routes = await import("../src/server/lib/paid-game-route");
  auth = await import("../src/server/services/wallet-auth.service");
  const challenge = await auth.issueWalletLoginChallenge(account.address);
  const signature = await account.signMessage({ message: challenge.message });
  token = (
    await auth.loginWithWallet({
      address: account.address,
      message: challenge.message,
      signature,
    })
  ).session.token;
});

after(async () => {
  globalThis.fetch = originalFetch;
  process.chdir(cwd);
  await rm(root, { recursive: true, force: true });
  if (testAdmin) {
    await testAdmin.unsafe(`DROP DATABASE ${testDatabaseName} WITH (FORCE)`);
    await testAdmin.end();
  }
});

async function seed(match: LiveMatch) {
  await store.withPlayDocument<Record<string, unknown>, void>(
    "play-tables",
    () => ({}),
    async (document) => {
      document.tables = [
        {
          id: match.state.roomId,
          game: match.game,
          label: "Test",
          slot: 1,
          status: "playing",
          version: 1,
          leftAddresses: [],
          matchId: match.id,
          seats: seats.map((seat) => ({
            address: seat.id,
            username: seat.username,
            seat: seat.seat,
            ready: true,
            sitTxHash: `0x${String(seat.seat).repeat(64)}`,
            leaveToken: `test-${seat.seat}`,
            refundTxHash: null,
          })),
        },
      ];
      document.entryCutoverBlock = "1";
      document.usedTx = [];
      document.pendingRefunds = [];
      document.matches = { [match.id]: match };
    },
  );
}

test("Ludo enforces turn ownership, legal moves, roll consumption and third-six penalty", () => {
  const match = fixture("ludo");
  assert.equal(match.game, "ludo");
  if (match.game !== "ludo") return;
  assert.throws(
    () => applyMatchAction(match, rival.address, "roll"),
    /not your turn/,
  );
  applyMatchAction(
    match,
    account.address,
    "roll",
    undefined,
    Date.now(),
    () => 6,
  );
  assert.throws(
    () => applyMatchAction(match, account.address, "roll"),
    /Move a pawn/,
  );
  assert.throws(
    () => applyMatchAction(match, account.address, "move", "opponent-pawn"),
    /legal pawn/,
  );
  const pawn = match.state.players[0].pawns[0].id;
  applyMatchAction(match, account.address, "move", pawn);
  assert.equal(match.state.players[0].pawns[0].status, "track");
  applyMatchAction(
    match,
    account.address,
    "roll",
    undefined,
    Date.now(),
    () => 6,
  );
  applyMatchAction(match, account.address, "move", pawn);
  applyMatchAction(
    match,
    account.address,
    "roll",
    undefined,
    Date.now(),
    () => 6,
  );
  assert.equal(match.state.activeSeat, 2);
  assert.equal(match.state.lastRoll, null);
});

test("Monopoly cannot reroll while a purchase is unresolved; decline advances to the other human", () => {
  const match = fixture("monopoly");
  if (match.game !== "monopoly") return;
  let index = 0;
  applyMatchAction(
    match,
    account.address,
    "roll",
    undefined,
    Date.now(),
    () => [1, 2][index++] as 1 | 2,
  );
  assert.equal(match.pendingBuy, 3);
  assert.throws(
    () => applyMatchAction(match, account.address, "roll"),
    /decline/,
  );
  applyMatchAction(match, account.address, "end-turn");
  assert.equal(match.state.activeSeat, 2);
  assert.equal(match.pendingBuy, null);
});

test("Server deadlines advance disconnected humans and bots without browser state", () => {
  const match = fixture("ludo");
  tickMatch(match, match.deadline);
  assert.equal(match.state.activeSeat, 2);
  const botMatch = createLiveMatch({
    roomId: "LUD-2",
    game: "ludo",
    fundedSeats: 1,
    seats: [
      { id: "bot-test", username: "Bot", seat: 1 },
      { ...seats[0], seat: 2 },
    ],
  });
  tickMatch(botMatch, botMatch.deadline, () => 1);
  assert.equal(botMatch.state.activeSeat, 2);
});

test("A winner produces an exact ETH settlement from funded seats only", () => {
  const match = fixture("monopoly");
  applyMatchAction(match, rival.address, "forfeit");
  assert.equal(match.winnerSeat, 1);
  assert.equal(match.settlement?.status, "pending");
  assert.equal(match.settlement?.grossPot, "0.004");
  assert.equal(match.settlement?.netPayout, "0.00392");
  assert.throws(
    () => applyMatchAction(match, account.address, "roll"),
    /finished/,
  );
});

test("Persisted API snapshots agree for independent readers and reject concurrent stale actions", async () => {
  const match = fixture("ludo");
  await seed(match);
  const request = {
    tableId: "LUD-1",
    game: "ludo" as const,
    matchId: match.id,
    version: match.version,
    address: account.address,
    action: "roll" as const,
  };
  const results = await Promise.allSettled([
    service.actPaidMatch(request),
    service.actPaidMatch(request),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const [first, second] = await Promise.all([
    service.getPaidMatch("LUD-1", "ludo"),
    service.getPaidMatch("LUD-1", "ludo"),
  ]);
  assert.deepEqual(first, second);
  assert.equal(first.version, 1);
  await assert.rejects(
    service.actPaidMatch({
      ...request,
      address: "0x0000000000000000000000000000000000000000",
      version: first.version,
    }),
    /confirmed entry/,
  );
});

test("Game routes reject anonymous and forged-wallet requests before mutating the board", async () => {
  const match = fixture("ludo");
  await seed(match);
  const body = { matchId: match.id, version: 0, address: account.address };
  const anonymous = await routes.paidGameRoute(
    new Request("http://localhost/api/ludo/rooms/LUD-1/roll", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    "LUD-1",
    "ludo",
    "roll",
  );
  assert.equal(anonymous?.status, 401);
  const forged = await routes.paidGameRoute(
    new Request("http://localhost/api/ludo/rooms/LUD-1/roll", {
      method: "POST",
      headers: { "x-session-token": token },
      body: JSON.stringify({ ...body, address: rival.address }),
    }),
    "LUD-1",
    "ludo",
    "roll",
  );
  assert.equal(forged?.status, 403);
  const valid = await routes.paidGameRoute(
    new Request("http://localhost/api/ludo/rooms/LUD-1/roll", {
      method: "POST",
      headers: { "x-session-token": token },
      body: JSON.stringify(body),
    }),
    "LUD-1",
    "ludo",
    "roll",
  );
  assert.equal(valid?.status, 200);
  const reload = await routes.paidGameRoute(
    new Request("http://localhost/api/ludo/rooms/LUD-1"),
    "LUD-1",
    "ludo",
  );
  assert.equal((await reload!.json()).match.version, 1);
});

test("Treasury preparation saves and reuses an immutable signed intent", async () => {
  const chain = await import("../src/server/lib/play-chain");
  const transfer = await chain.preparePlayTransfer(
    account.address,
    "0.001",
    "test-intent",
  );
  const repeated = await chain.preparePlayTransfer(
    account.address,
    "0.001",
    "test-intent",
  );
  assert.equal(transfer.hash, repeated.hash);
  await assert.rejects(chain.preparePlayTransfer(rival.address, "0.001", "test-intent"), /does not match/);
  await assert.rejects(chain.preparePlayTransfer(account.address, "0.002", "test-intent"), /does not match/);
});

test("Settlement retries and concurrent calls reuse one signed transaction and confirm only a successful receipt", async () => {
  const match = fixture("monopoly");
  applyMatchAction(match, rival.address, "forfeit");
  await seed(match);
  receiptStatus = "pending";
  const first = await settlement.settlePaidMatch(match);
  assert.equal(first.settlement?.status, "submitted");
  assert.equal(first.settlement?.confirmedAt, null);
  await Promise.all([
    settlement.settlePaidMatch(match),
    settlement.settlePaidMatch(match),
  ]);
  assert.ok(sent.length >= 1);
  assert.equal(new Set(sent).size, 1);
  const transaction = parseTransaction(sent[0]);
  assert.equal(transaction.to?.toLowerCase(), account.address.toLowerCase());
  assert.equal(transaction.value, parseEther("0.00392"));
  receiptStatus = "success";
  const confirmed = await settlement.settlePaidMatch(match);
  assert.equal(confirmed.settlement?.status, "confirmed");
  assert.ok(confirmed.settlement?.confirmedAt);
  const sends = sent.length;
  await settlement.settlePaidMatch(match);
  assert.equal(sent.length, sends);
});

test("Reverted payout is never reported as confirmed", async () => {
  const match = fixture("monopoly");
  applyMatchAction(match, rival.address, "forfeit");
  await seed(match);
  receiptStatus = "reverted";
  const failed = await settlement.settlePaidMatch(match);
  assert.equal(failed.settlement?.status, "failed");
  assert.equal(failed.settlement?.confirmedAt, null);
  assert.match(failed.settlement?.error ?? "", /reverted/);
});

test("Paid Ludo waits for four distinct paying humans and never inserts house bots", async () => {
  await store.withPlayDocument<Record<string, unknown>, void>(
    "play-tables",
    () => ({}),
    async (document) => {
      document.tables = [];
      document.usedTx = [];
      document.matches = {};
      document.pendingRefunds = [];
      document.entryCutoverBlock = "1";
    },
  );
  const chain = await import("../src/server/lib/play-chain");
  const { getBoardChainId } = await import("../src/lib/wallet/chains");
  const txHash = `0x${"33".repeat(32)}` as Hex;
  entryTransactions.set(txHash, {
    from: account.address,
    to: chain.getPlayTreasuryAddress(),
    value: `0x${parseEther("0.002").toString(16)}`,
    input: stringToHex("LUD-1"),
    chainId: `0x${getBoardChainId().toString(16)}`,
  });
  receiptStatus = "success";
  const entry = {
    game: "ludo" as const,
    tableId: "LUD-1",
    address: account.address,
    txHash,
  };
  const [first, retry] = await Promise.all([
    service.sitPlayTable(entry),
    service.sitPlayTable(entry),
  ]);
  assert.ok(first.ok && retry.ok, JSON.stringify({ first, retry }));
  if (!first.ok || !retry.ok) return;
  assert.equal(first.seat, retry.seat);
  await store.withPlayDocument<{ pendingRefunds: unknown[] }, void>(
    "play-tables",
    () => ({ pendingRefunds: [] }),
    async (document) => assert.equal(document.pendingRefunds.length, 0),
  );
  const tx2 = `0x${"44".repeat(32)}` as Hex;
  entryTransactions.set(tx2, {
    ...entryTransactions.get(txHash)!,
    from: rival.address,
  });
  const second = await service.sitPlayTable({
    ...entry,
    address: rival.address,
    txHash: tx2,
  });
  assert.ok(second.ok);
  if (!second.ok) return;
  assert.equal(
    second.table.seats.filter((seat) => !seat.address.startsWith("bot-"))
      .length,
    2,
  );
  await service.readyPlayTable({
    tableId: "LUD-1",
    leaveToken: first.leaveToken,
    address: account.address,
    txHash,
  });
  const ready = await service.readyPlayTable({
    tableId: "LUD-1",
    leaveToken: second.leaveToken,
    address: rival.address,
    txHash: tx2,
  });
  assert.ok(ready.ok && !ready.table.matchId);
  assert.equal(ready.table.seats.length, 2);
  for (const key of ["88", "99"]) {
    const human = privateKeyToAccount(`0x${key.repeat(32)}`);
    const tx = `0x${key.repeat(32)}` as Hex;
    entryTransactions.set(tx, { ...entryTransactions.get(txHash)!, from: human.address });
    const joined = await service.sitPlayTable({ ...entry, address: human.address, txHash: tx });
    assert.ok(joined.ok);
    if (!joined.ok) return;
    await service.readyPlayTable({ tableId: "LUD-1", address: human.address, txHash: tx, leaveToken: joined.leaveToken });
  }
  const match = await service.getPaidMatch("LUD-1", "ludo");
  assert.equal(match.fundedSeats, 4);
  assert.equal(match.state.players.length, 4);
  assert.ok(match.state.players.every((p) => !p.id.startsWith("bot-")));
  for (const player of match.state.players.slice(1)) applyMatchAction(match, player.id, "forfeit");
  assert.equal(match.settlement?.grossPot, "0.008");
  assert.equal(match.settlement?.feeAmount, "0.00016");
  assert.equal(match.settlement?.netPayout, "0.00784");
});

test("Wrong-table and reverted entry payments never open a seat", async () => {
  const chain = await import("../src/server/lib/play-chain");
  const hash = `0x${"55".repeat(32)}` as Hex;
  const { getBoardChainId } = await import("../src/lib/wallet/chains");
  entryTransactions.set(hash, {
    from: account.address,
    to: chain.getPlayTreasuryAddress(),
    value: `0x${parseEther("0.002").toString(16)}`,
    input: stringToHex("LUD-1suffix"),
    chainId: `0x${getBoardChainId().toString(16)}`,
  });
  receiptStatus = "success";
  assert.equal(
    (
      await chain.verifySitTransaction({
        hash,
        from: account.address,
        tableId: "LUD-1",
      })
    ).ok,
    false,
  );
  receiptStatus = "reverted";
  assert.equal(
    (await chain.verifySitTransaction({ hash, from: account.address })).ok,
    false,
  );
});

test("Launch defaults to Ludo and refuses new Monopoly entries before requesting payment", async () => {
  assert.equal(isGameEnabled("ludo"), true);
  assert.equal(isGameEnabled("monopoly"), false);
  assert.equal(enabledPlayGame(null), "ludo");
  assert.equal(enabledPlayGame("monopoly"), "ludo");
  assert.equal(enabledPlayGame("ludo"), "ludo");
  const lobby = await service.listPlayLobby();
  assert.equal(lobby.length, 4);
  assert.ok(lobby.every((table) => table.game === "ludo"));

  for (const game of ["monopoly", "ludo"] as const) {
    const result = await service.claimUnpaidSit({
      game,
      tableId: "MNP-1",
      address: account.address,
    });
    assert.ok(!result.ok);
    if (!result.ok) assert.equal(result.code, "GAME_DISABLED");
  }
  const ready = await service.readyPlayTable({
    tableId: "MNP-1",
    address: account.address,
    leaveToken: "fake-token",
  });
  assert.ok(!ready.ok);
  if (!ready.ok) assert.equal(ready.code, "GAME_DISABLED");
  assert.equal((await service.getPlayTable("MNP-1"))?.status, "waiting");
});

test("Legacy generic and Monopoly-specific joins cannot debit a disabled room", async () => {
  const { joinRoom } = await import("../src/server/services/join-room.service");
  const { MOCK_ROOMS, MOCK_PLAYER } = await import("../src/lib/mock/lobby");
  const room = MOCK_ROOMS.find((room) => room.gameType === "monopoly")!;
  const before = structuredClone(room);
  if (databaseMode) {
    const { getDb } = await import("../src/server/db");
    const { rooms } = await import("../src/server/db/schema");
    const { resolveSessionToken } = await import("../src/server/services/auth.service");
    const session = await resolveSessionToken(token);
    assert.ok(session);
    for (const gameType of ["monopoly", "ludo"] as const) {
      const [databaseRoom] = await getDb().insert(rooms).values({ gameType, entryFee: "10", maxPlayers: 4 }).returning();
      const result = await joinRoom(databaseRoom.id, session.user.id, { requireGame: gameType });
      assert.ok(!result.ok);
      if (!result.ok) assert.equal(result.code, "GAME_DISABLED");
    }
    return;
  }
  for (const options of [{}, { requireGame: "monopoly" as const }]) {
    const result = await joinRoom(room.id, MOCK_PLAYER.id, options);
    assert.ok(!result.ok);
    if (!result.ok) assert.equal(result.code, "GAME_DISABLED");
  }
  assert.deepEqual(room, before);
});

test("Already-funded Monopoly seats remain recoverable without enabling new starts", async () => {
  const match = fixture("monopoly");
  await seed(match);
  const recovered = await service.claimUnpaidSit({
    game: "monopoly",
    tableId: "MNP-1",
    address: account.address,
  });
  assert.ok(recovered.ok && recovered.alreadySeated);
  const lobby = await service.listPlayLobby(account.address);
  assert.ok(lobby.some((table) => table.tableId === "MNP-1"));
  const outsiders = await service.listPlayLobby();
  assert.ok(outsiders.every((table) => table.game === "ludo"));
  assert.equal((await service.getPaidMatch("MNP-1", "monopoly")).id, match.id);
});

test("A verified late Monopoly payment is queued for refund, never seated or reused", async () => {
  const payer = privateKeyToAccount(`0x${"66".repeat(32)}`);
  const hash = `0x${"77".repeat(32)}` as Hex;
  const chain = await import("../src/server/lib/play-chain");
  const { getBoardChainId } = await import("../src/lib/wallet/chains");
  entryTransactions.set(hash, {
    from: payer.address,
    to: chain.getPlayTreasuryAddress(),
    value: `0x${parseEther("0.002").toString(16)}`,
    input: stringToHex("MNP-2"),
    chainId: `0x${getBoardChainId().toString(16)}`,
  });
  receiptStatus = "success";
  const input = { game: "monopoly" as const, tableId: "MNP-2", address: payer.address, txHash: hash };
  const result = await service.sitPlayTable(input);
  assert.ok(!result.ok);
  if (!result.ok) {
    assert.equal(result.code, "GAME_DISABLED");
    assert.equal(result.refund, true);
    assert.match(result.message, /refund is queued/);
  }
  assert.equal((await service.getPlayTable("MNP-2"))?.seats.length, 0);
  const retry = await service.sitPlayTable(input);
  assert.ok(!retry.ok);
  if (!retry.ok) assert.equal(retry.code, "TX_USED");
  receiptStatus = "pending";
  await service.flushPendingRefunds();
  const pending = (await service.getPaidPlayHistory(payer.address)).refunds[0];
  assert.equal(pending.status, "submitted");
  assert.ok(pending.txHash);
  assert.equal(pending.confirmedAt, null);
  receiptStatus = "success";
  await service.flushPendingRefunds();
  const confirmed = (await service.getPaidPlayHistory(payer.address)).refunds[0];
  assert.equal(confirmed.status, "confirmed");
  assert.equal(confirmed.txHash, pending.txHash);
  assert.ok(confirmed.confirmedAt);
});

test("unready seats expire and ready rooms time out into durable full refunds without a browser", async () => {
  const match = fixture("ludo");
  await seed(match);
  await store.withPlayDocument<{ tables: { status: string; matchId?: string; waitingUntil: number; seats: { ready: boolean; readyBy: number }[] }[]; matches: object }, void>("play-tables", () => ({ tables: [], matches: {} }), async (document) => {
    const table = document.tables[0];
    table.status = "waiting"; delete table.matchId; document.matches = {};
    table.waitingUntil = Date.now() + 100_000;
    table.seats.forEach((seat, i) => { seat.ready = i === 1; seat.readyBy = Date.now() - 1; });
  });
  await service.maintainPaidPlay();
  assert.equal((await service.getPlayTable("LUD-1"))?.seats.length, 1);
  assert.equal((await service.getPaidPlayHistory(account.address)).refunds[0]?.status, "queued");
  await store.withPlayDocument<{ tables: { waitingUntil: number }[] }, void>("play-tables", () => ({ tables: [] }), async (document) => { document.tables[0].waitingUntil = Date.now() - 1; });
  await service.maintainPaidPlay();
  assert.equal((await service.getPlayTable("LUD-1"))?.seats.length, 0);
  assert.equal((await service.getPaidPlayHistory(rival.address)).refunds[0]?.status, "queued");
  assert.equal((await service.getPaidPlayHistory(account.address)).refunds.length, 1);
  const consumed = await service.sitPlayTable({ game: "ludo", tableId: "LUD-1", address: account.address, txHash: `0x${"1".repeat(64)}` });
  assert.ok(!consumed.ok && consumed.code === "TX_USED" && consumed.refund);
});

test("seat recovery is authenticated and cannot create a new seat or discover payments", async () => {
  const match = fixture("ludo"); await seed(match);
  const recovery = await import("../src/app/api/play/tables/[tableId]/recover/route");
  const context = { params: Promise.resolve({ tableId: "LUD-1" }) };
  const request = (address: string, signed = true) => new Request("http://localhost", {
    method: "POST", headers: signed ? { "x-session-token": token } : {}, body: JSON.stringify({ address }),
  });
  assert.equal((await recovery.POST(request(account.address, false), context)).status, 401);
  assert.equal((await recovery.POST(request(rival.address), context)).status, 403);
  const recovered = await recovery.POST(request(account.address), context);
  assert.equal(recovered.status, 200);
  assert.equal((await recovered.json()).leaveToken, "test-1");
  assert.equal((await service.getPlayTable("LUD-1"))?.seats.length, 2);
});

test("configuration does not trigger refund broadcasts and mainnet fails closed", async () => {
  const count = sent.length;
  const config = service.getPlayConfig();
  assert.equal(config.entryFeeWei, parseEther("0.002").toString());
  assert.equal(sent.length, count);
  const { getPlayEntryReadiness } = await import("../src/server/lib/play-readiness");
  process.env.NEXT_PUBLIC_CHAIN_ENV = "mainnet";
  delete process.env.PLAY_MAINNET_ENABLED;
  try {
    assert.equal((await getPlayEntryReadiness()).entriesAllowed, false);
    await assert.rejects(service.getPlayTable("LUD-1"), /another network/);
  } finally { process.env.NEXT_PUBLIC_CHAIN_ENV = "testnet"; }
});

test("concurrent treasury reservations have unique nonces, and a pre-broadcast crash is recoverable", { timeout: 30_000 }, async () => {
  const chain = await import("../src/server/lib/play-chain");
  const previousSends = sent.length;
  const transfers = await Promise.all(Array.from({ length: 12 }, (_, i) => chain.preparePlayTransfer(account.address, "0.001", `concurrent-${i}`)));
  assert.equal(new Set(transfers.map((transfer) => transfer.nonce)).size, 12);
  assert.equal(sent.length, previousSends, "preparing must not broadcast");
  receiptStatus = "pending";
  await chain.reconcileTreasuryTransfers();
  for (const transfer of transfers) assert.ok(sent.includes(transfer.raw));
  const repeated = await chain.preparePlayTransfer(account.address, "0.001", "concurrent-0");
  assert.equal(repeated.hash, transfers[0].hash);
});

test("a HEAD-shaped playing table without a server match becomes one refund per funded human", async () => {
  const match = fixture("monopoly"); await seed(match);
  await store.withPlayDocument<{ tables: { matchId?: string }[]; matches: object }, void>("play-tables", () => ({ tables: [], matches: {} }), async (document) => {
    delete document.tables[0].matchId; document.matches = {};
  });
  await service.maintainPaidPlay();
  assert.equal((await service.getPlayTable("MNP-1"))?.status, "waiting");
  assert.equal((await service.getPlayTable("MNP-1"))?.seats.length, 0);
  for (const human of [account, rival]) assert.equal((await service.getPaidPlayHistory(human.address)).refunds.length, 1);
  await service.maintainPaidPlay();
  assert.equal((await service.getPaidPlayHistory(account.address)).refunds.length, 1);
});

test("ready and resume never adopt a supplied receipt/token into a new seat", async () => {
  const { paidLeaveToken } = await import("../src/server/lib/play-seat-token");
  const hash = `0x${"aa".repeat(32)}` as Hex;
  const chain = await import("../src/server/lib/play-chain");
  const { getBoardChainId } = await import("../src/lib/wallet/chains");
  entryTransactions.set(hash, { from: account.address, to: chain.getPlayTreasuryAddress(), input: stringToHex("LUD-4"), value: `0x${parseEther("0.002").toString(16)}`, chainId: `0x${getBoardChainId().toString(16)}` });
  const input = { tableId: "LUD-4", address: account.address, txHash: hash, leaveToken: paidLeaveToken(hash) };
  receiptStatus = "success";
  const ready = await service.readyPlayTable(input);
  assert.equal(ready.ok, false);
  const route = await import("../src/app/api/play/tables/[tableId]/ready/route");
  const response = await route.POST(new Request("http://localhost", { method: "POST", headers: { "x-session-token": token }, body: JSON.stringify(input) }), { params: Promise.resolve({ tableId: "LUD-4" }) });
  assert.equal(response.status, 403);
  assert.equal((await service.resumePlayTable(input)).blocked, true);
  assert.equal((await service.getPlayTable("LUD-4"))?.seats.length, 0);
});

test("unknown historical payments cannot be replayed across a ledger cutover", async () => {
  const chain = await import("../src/server/lib/play-chain");
  await store.withPlayDocument<{ entryCutoverBlock: string }, void>("play-tables", () => ({ entryCutoverBlock: "1" }), async (document) => { document.entryCutoverBlock = "17"; });
  const result = await chain.verifySitTransaction({ hash: `0x${"aa".repeat(32)}`, from: account.address, tableId: "LUD-4" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error.message, /predates/);
});
