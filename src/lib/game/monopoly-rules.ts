import { BOARD_TILE_COUNT, BOARD_TILES, type BoardTile } from "@/lib/game/monopoly-board";
import type { DiceRoll } from "@/lib/game/dice";
import {
  MONOPOLY_STARTING_CASH,
  monopolyPrizePool,
  type MonopolyLogEntry,
  type MonopolyPlayer,
  type MonopolyRoomState,
} from "@/lib/mock/monopoly";
import { PLAY_ENTRY_FEE } from "@/lib/game/play-player";
import { MATCH_AFK_STRIKES, MATCH_TURN_SECONDS } from "@/lib/game/match-clock";
import { MAX_PLAYERS_PER_ROOM } from "@/lib/types";

export const GO_SALARY = 200;
export const JAIL_TILE = 12;
export const JAIL_FINE = 50;
export const MAX_JAIL_TURNS = 3;
export const MAX_DOUBLES = 3;
export const BURN_TAX = 100;
export const TOLL_FEE = 150;
export const AIRPORT_RENT = [25, 50, 100, 200] as const;

const RIVALS = [
  { id: "bot-pixel", username: "PixelBaron" },
  { id: "bot-dice", username: "DiceDuchess" },
  { id: "bot-rent", username: "RentSeeker" },
] as const;

type DrawnCard = {
  text: string;
  cash?: number;
  go?: boolean;
  jail?: boolean;
  tile?: number;
};

const CHANCE_CARDS: readonly DrawnCard[] = [
  { text: "Advance to GO. Collect 200.", go: true },
  { text: "Go directly to Jail. Do not pass GO.", jail: true },
  { text: "Bank error in your favor. Collect 50.", cash: 50 },
  { text: "Pay a 50 BOARD burn fee.", cash: -50 },
  { text: "Advance to New York.", tile: 46 },
  { text: "Advance to Rome.", tile: 9 },
  { text: "Your building loan matures. Collect 150.", cash: 150 },
  { text: "Speeding fine. Pay 15.", cash: -15 },
];

const TREASURY_CARDS: readonly DrawnCard[] = [
  { text: "Income tax refund. Collect 20.", cash: 20 },
  { text: "From sale of stock you collect 50.", cash: 50 },
  { text: "Pay hospital fees of 50.", cash: -50 },
  { text: "Holiday fund matures. Collect 100.", cash: 100 },
  { text: "Go to Jail. Do not pass GO.", jail: true },
  { text: "You inherit 100.", cash: 100 },
  { text: "Pay school fees of 50.", cash: -50 },
  { text: "Advance to GO. Collect 200.", go: true },
];

export type MonopolyExtra = {
  inJail?: boolean;
  jailTurnsLeft?: number;
  consecutiveDoubles?: number;
  /** Missed rolls this match. Three kicks the seat with no refund. */
  afkStrikes?: number;
};

export type MonopolyPlayState = MonopolyRoomState & {
  vault: number;
  extras: Record<number, MonopolyExtra>;
  /** Bumps when the same seat gets another roll (doubles), so NPCs keep playing. */
  cue: number;
};

export type LandingResult = {
  state: MonopolyPlayState;
  pendingBuy: number | null;
  rent: {
    tileIndex: number;
    due: number;
    paid: number;
    bankrupted: boolean;
    ownerSeat: number;
    payerSeat: number;
  } | null;
  goToJail: boolean;
  extraTurn: boolean;
};

function log(
  state: MonopolyPlayState,
  seat: number | null,
  message: string,
): MonopolyLogEntry[] {
  return [
    { id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, seat, message },
    ...state.log,
  ];
}

function playerAt(state: MonopolyPlayState, seat: number) {
  return state.players.find((player) => player.position === seat);
}

function patchPlayer(
  state: MonopolyPlayState,
  seat: number,
  patch: Partial<MonopolyPlayer>,
): MonopolyPlayState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.position === seat ? { ...player, ...patch } : player,
    ),
  };
}

function patchExtra(
  state: MonopolyPlayState,
  seat: number,
  patch: Partial<MonopolyExtra>,
): MonopolyPlayState {
  return {
    ...state,
    extras: {
      ...state.extras,
      [seat]: { ...state.extras[seat], ...patch },
    },
  };
}

function addCash(state: MonopolyPlayState, seat: number, amount: number) {
  const player = playerAt(state, seat);
  if (!player) return state;
  return patchPlayer(state, seat, { cash: Math.max(0, player.cash + amount) });
}

export function isBuyable(tile: BoardTile) {
  return (tile.kind === "country" || tile.kind === "airport") && Boolean(tile.price);
}

export function airportCount(state: MonopolyPlayState, seat: number) {
  return BOARD_TILES.filter(
    (tile) => tile.kind === "airport" && state.owners[tile.index] === seat,
  ).length;
}

export function groupComplete(
  state: MonopolyPlayState,
  seat: number,
  group: string,
) {
  const tiles = BOARD_TILES.filter((tile) => tile.group === group);
  return tiles.length > 0 && tiles.every((tile) => state.owners[tile.index] === seat);
}

export function rentDue(
  state: MonopolyPlayState,
  tile: BoardTile,
  ownerSeat: number,
) {
  if (tile.kind === "airport") {
    const owned = airportCount(state, ownerSeat);
    return AIRPORT_RENT[Math.max(0, Math.min(owned, 4) - 1)] ?? 25;
  }
  const base = tile.rent ?? 0;
  if (tile.group && groupComplete(state, ownerSeat, tile.group)) return base * 2;
  return base;
}

function passedGo(from: number, to: number, steps: number) {
  if (steps <= 0) return false;
  if (to === 0) return true;
  return from + steps >= BOARD_TILE_COUNT;
}

export function sendToJail(state: MonopolyPlayState, seat: number): MonopolyPlayState {
  const player = playerAt(state, seat);
  if (!player) return state;
  let next = patchPlayer(state, seat, { tile: JAIL_TILE });
  next = patchExtra(next, seat, {
    inJail: true,
    jailTurnsLeft: MAX_JAIL_TURNS,
    consecutiveDoubles: 0,
  });
  next = { ...next, log: log(next, seat, `${who(player)} went to Jail.`) };
  return next;
}

function who(player: MonopolyPlayer) {
  return player.isYou ? "You" : player.username;
}

function pickCard(cards: readonly DrawnCard[], randomIndex: (max: number) => number): DrawnCard {
  return cards[randomIndex(cards.length)] ?? cards[0]!;
}

function applyCashDelta(
  state: MonopolyPlayState,
  seat: number,
  amount: number,
): MonopolyPlayState {
  if (amount === 0) return state;
  const player = playerAt(state, seat);
  if (!player) return state;
  if (amount > 0) return addCash(state, seat, amount);
  return takeCash(state, seat, -amount, "bank").state;
}

function takeCash(
  state: MonopolyPlayState,
  seat: number,
  due: number,
  creditor: "bank" | number,
): { state: MonopolyPlayState; paid: number; bankrupted: boolean } {
  const payer = playerAt(state, seat);
  if (!payer) return { state, paid: 0, bankrupted: false };

  const paid = Math.min(due, payer.cash);
  const bankrupted = paid < due;
  let next = patchPlayer(state, seat, {
    cash: payer.cash - paid,
    status: bankrupted ? "eliminated" : payer.status,
  });

  if (creditor !== "bank") {
    const owner = playerAt(next, creditor);
    if (owner) {
      next = patchPlayer(next, creditor, { cash: owner.cash + paid });
    }
  } else {
    next = { ...next, vault: next.vault + paid };
  }

  if (bankrupted) {
    const transferTo = creditor === "bank" ? null : creditor;
    const nextOwners = { ...next.owners };
    let given = 0;
    for (const [tile, ownerSeat] of Object.entries(nextOwners)) {
      if (Number(ownerSeat) !== seat) continue;
      const index = Number(tile);
      if (transferTo == null) delete nextOwners[index];
      else nextOwners[index] = transferTo;
      given += 1;
    }
    next = {
      ...next,
      owners: nextOwners,
      players: next.players.map((player) => {
        if (player.position === seat) return { ...player, owned: 0, cash: 0 };
        if (transferTo != null && player.position === transferTo) {
          return { ...player, owned: player.owned + given };
        }
        return player;
      }),
      log: log(
        next,
        seat,
        `${who(payer)} ${payer.isYou ? "are" : "is"} bankrupt and out.`,
      ),
    };
  }

  return { state: next, paid, bankrupted };
}

function moveToTile(
  state: MonopolyPlayState,
  seat: number,
  to: number,
  collectGo: boolean,
): MonopolyPlayState {
  const player = playerAt(state, seat);
  if (!player) return state;
  const from = player.tile;
  let next = patchPlayer(state, seat, { tile: to });
  const wrapped = from !== to && (to === 0 || to < from);
  if (collectGo && wrapped) {
    next = addCash(next, seat, GO_SALARY);
    next = { ...next, log: log(next, seat, `${who(player)} collected ${GO_SALARY} for passing GO.`) };
  }
  return next;
}

export function resolveCardMove(
  state: MonopolyPlayState,
  seat: number,
  card: DrawnCard,
): MonopolyPlayState {
  const player = playerAt(state, seat);
  if (!player) return state;
  let next: MonopolyPlayState = {
    ...state,
    log: log(state, seat, `${who(player)} drew: ${card.text}`),
  };
  if (card.cash) next = applyCashDelta(next, seat, card.cash);
  if (card.jail) return sendToJail(next, seat);
  if (card.go) return moveToTile(next, seat, 0, false);
  if (typeof card.tile === "number") {
    return moveToTile(next, seat, card.tile, true);
  }
  return next;
}

export function applyRollMove(
  state: MonopolyPlayState,
  seat: number,
  roll: DiceRoll,
): { state: MonopolyPlayState; from: number; to: number; goToJail: boolean } {
  const player = playerAt(state, seat);
  if (!player) return { state, from: 0, to: 0, goToJail: false };

  const extras = state.extras[seat] ?? {};
  const doubles = roll.isDouble ? (extras.consecutiveDoubles ?? 0) + 1 : 0;
  let next = patchExtra(state, seat, { consecutiveDoubles: doubles });
  next = { ...next, log: log(next, seat, `${who(player)} rolled ${roll.dice[0]} and ${roll.dice[1]}.`) };

  if (doubles >= MAX_DOUBLES) {
    next = sendToJail(next, seat);
    return { state: next, from: player.tile, to: JAIL_TILE, goToJail: true };
  }

  const from = player.tile;
  const to = (from + roll.total) % BOARD_TILE_COUNT;
  next = patchPlayer(next, seat, { tile: to });
  if (passedGo(from, to, roll.total) && to !== 0) {
    next = addCash(next, seat, GO_SALARY);
    next = {
      ...next,
      log: log(next, seat, `${who(player)} passed GO and collected ${GO_SALARY}.`),
    };
  }
  return { state: next, from, to, goToJail: false };
}

export function resolveLanding(
  state: MonopolyPlayState,
  seat: number,
  extraTurn: boolean,
  randomIndex: (max: number) => number = (max) => Math.floor(Math.random() * max),
): LandingResult {
  const player = playerAt(state, seat);
  const empty: LandingResult = {
    state,
    pendingBuy: null,
    rent: null,
    goToJail: false,
    extraTurn,
  };
  if (!player || player.status === "eliminated") return empty;

  const tile = BOARD_TILES[player.tile];
  if (!tile) return empty;

  let next: MonopolyPlayState = {
    ...state,
    log: log(state, seat, `${who(player)} landed on ${tile.name}.`),
  };
  const you = player.isYou;

  if (tile.kind === "go") {
    next = addCash(next, seat, GO_SALARY);
    next = { ...next, log: log(next, seat, `${who(player)} collected ${GO_SALARY} salary.`) };
    return { state: next, pendingBuy: null, rent: null, goToJail: false, extraTurn };
  }

  if (tile.kind === "go-to-jail") {
    next = sendToJail(next, seat);
    return { state: next, pendingBuy: null, rent: null, goToJail: true, extraTurn: false };
  }

  if (tile.kind === "jail" || tile.kind === "vault") {
    if (tile.kind === "vault" && next.vault > 0) {
      const pot = next.vault;
      next = addCash({ ...next, vault: 0 }, seat, pot);
      next = { ...next, log: log(next, seat, `${who(player)} collected ${pot} from the vault.`) };
    }
    return { state: next, pendingBuy: null, rent: null, goToJail: false, extraTurn };
  }

  if (tile.kind === "burn") {
    const due = Math.min(BURN_TAX, Math.max(10, Math.floor(player.cash * 0.1)));
    const taken = takeCash(next, seat, due, "bank");
    taken.state = {
      ...taken.state,
      log: log(taken.state, seat, `${who(player)} paid ${taken.paid} burn tax.`),
    };
    return {
      state: taken.state,
      pendingBuy: null,
      rent: null,
      goToJail: false,
      extraTurn: extraTurn && !taken.bankrupted,
    };
  }

  if (tile.kind === "exchange") {
    const taken = takeCash(next, seat, TOLL_FEE, "bank");
    taken.state = {
      ...taken.state,
      log: log(taken.state, seat, `${who(player)} paid ${taken.paid} toll.`),
    };
    return {
      state: taken.state,
      pendingBuy: null,
      rent: null,
      goToJail: false,
      extraTurn: extraTurn && !taken.bankrupted,
    };
  }

  if (tile.kind === "chance" || tile.kind === "treasury") {
    const card = pickCard(tile.kind === "chance" ? CHANCE_CARDS : TREASURY_CARDS, randomIndex);
    next = resolveCardMove(next, seat, card);
    const after = playerAt(next, seat);
    const jailed = Boolean(next.extras[seat]?.inJail);
    if (jailed) {
      return { state: next, pendingBuy: null, rent: null, goToJail: true, extraTurn: false };
    }
    if (after && after.tile !== player.tile && after.status === "alive") {
      return resolveLanding(next, seat, extraTurn, randomIndex);
    }
    return { state: next, pendingBuy: null, rent: null, goToJail: false, extraTurn };
  }

  if (isBuyable(tile)) {
    const ownerSeat = next.owners[tile.index];
    if (ownerSeat === undefined) {
      return {
        state: next,
        pendingBuy: you ? tile.index : tile.index,
        rent: null,
        goToJail: false,
        extraTurn,
      };
    }
    if (ownerSeat === seat) {
      next = { ...next, log: log(next, seat, `${who(player)} already owns ${tile.name}.`) };
      return { state: next, pendingBuy: null, rent: null, goToJail: false, extraTurn };
    }
    const due = rentDue(next, tile, ownerSeat);
    const taken = takeCash(next, seat, due, ownerSeat);
    const owner = playerAt(state, ownerSeat);
    taken.state = {
      ...taken.state,
      log: log(
        taken.state,
        seat,
        `${who(player)} paid ${taken.paid} rent to ${owner?.isYou ? "you" : owner?.username ?? "a rival"} for ${tile.name}.`,
      ),
    };
    return {
      state: taken.state,
      pendingBuy: null,
      rent: {
        tileIndex: tile.index,
        due,
        paid: taken.paid,
        bankrupted: taken.bankrupted,
        ownerSeat,
        payerSeat: seat,
      },
      goToJail: false,
      extraTurn: extraTurn && !taken.bankrupted,
    };
  }

  return { state: next, pendingBuy: null, rent: null, goToJail: false, extraTurn };
}

export function buyTile(
  state: MonopolyPlayState,
  seat: number,
  tileIndex: number,
): MonopolyPlayState | null {
  const player = playerAt(state, seat);
  const tile = BOARD_TILES[tileIndex];
  if (!player || !tile || !isBuyable(tile)) return null;
  if (state.owners[tileIndex] !== undefined) return null;
  if (player.tile !== tileIndex) return null;
  const price = tile.price ?? 0;
  if (player.cash < price) return null;

  let next = patchPlayer(state, seat, {
    cash: player.cash - price,
    owned: player.owned + 1,
  });
  next = {
    ...next,
    owners: { ...next.owners, [tileIndex]: seat },
    log: log(next, seat, `${who(player)} bought ${tile.name} for ${price}.`),
  };
  return next;
}

export function npcShouldBuy(state: MonopolyPlayState, seat: number, tileIndex: number) {
  const player = playerAt(state, seat);
  const tile = BOARD_TILES[tileIndex];
  if (!player || !tile || !isBuyable(tile)) return false;
  const price = tile.price ?? 0;
  return player.cash >= price + 180;
}

export function leaveJailByFine(state: MonopolyPlayState, seat: number): MonopolyPlayState | null {
  const player = playerAt(state, seat);
  if (!player || !state.extras[seat]?.inJail) return null;
  if (player.cash < JAIL_FINE) return null;
  let next = addCash(state, seat, -JAIL_FINE);
  next = { ...next, vault: next.vault + JAIL_FINE };
  next = patchExtra(next, seat, { inJail: false, jailTurnsLeft: 0, consecutiveDoubles: 0 });
  next = { ...next, log: log(next, seat, `${who(player)} paid ${JAIL_FINE} to leave Jail.`) };
  return next;
}

export function leaveJailByDoubles(state: MonopolyPlayState, seat: number) {
  return patchExtra(state, seat, {
    inJail: false,
    jailTurnsLeft: 0,
    consecutiveDoubles: 0,
  });
}

export function stayInJail(state: MonopolyPlayState, seat: number): MonopolyPlayState {
  const extra = state.extras[seat] ?? {};
  const left = Math.max(0, (extra.jailTurnsLeft ?? 1) - 1);
  const player = playerAt(state, seat);
  if (!player) return state;
  if (left === 0) {
    const paid = leaveJailByFine(state, seat);
    if (paid) return paid;
    const taken = takeCash(state, seat, JAIL_FINE, "bank");
    let next = patchExtra(taken.state, seat, {
      inJail: false,
      jailTurnsLeft: 0,
      consecutiveDoubles: 0,
    });
    next = {
      ...next,
      log: log(
        next,
        seat,
        `${who(player)} could not cover the ${JAIL_FINE} jail fine.`,
      ),
    };
    return next;
  }
  return {
    ...patchExtra(state, seat, { jailTurnsLeft: left }),
    log: log(state, seat, `${who(player)} stays in Jail (${left} turns left).`),
  };
}

export function nextAliveSeat(state: MonopolyPlayState, fromSeat: number) {
  const alive = [...state.players]
    .filter((player) => player.status !== "eliminated")
    .sort((a, b) => a.position - b.position);
  if (alive.length === 0) {
    return { activeSeat: fromSeat, turnDelta: 0 };
  }
  const next = alive.find((player) => player.position > fromSeat) ?? alive[0];
  return {
    activeSeat: next.position,
    turnDelta: next.position <= fromSeat ? 1 : 0,
  };
}

export function advanceTurn(state: MonopolyPlayState, fromSeat: number): MonopolyPlayState {
  const next = nextAliveSeat(state, fromSeat);
  return {
    ...state,
    activeSeat: next.activeSeat,
    turn: state.turn + next.turnDelta,
    turnSecondsLeft: MATCH_TURN_SECONDS,
  };
}

/** Mark a seat out. Properties return to the bank. Sit fee is not refunded. */
export function eliminateSeat(
  state: MonopolyPlayState,
  seat: number,
  message: string,
): MonopolyPlayState {
  const player = playerAt(state, seat);
  if (!player || player.status === "eliminated") return state;

  const owners = { ...state.owners };
  for (const key of Object.keys(owners)) {
    const tile = Number(key);
    if (owners[tile] === seat) delete owners[tile];
  }

  let next: MonopolyPlayState = {
    ...patchPlayer(state, seat, { status: "eliminated", owned: 0 }),
    owners,
    log: log(state, seat, message),
  };

  if (next.activeSeat === seat && !soleWinner(next)) {
    next = advanceTurn(next, seat);
  }
  return next;
}

/**
 * Player ran out of time to roll. Passes the turn, or kicks after three misses.
 * Sit fee is not refunded on a kick.
 */
export function recordAfkMiss(
  state: MonopolyPlayState,
  seat: number,
): { state: MonopolyPlayState; kicked: boolean } {
  const player = playerAt(state, seat);
  if (!player || player.status === "eliminated") {
    return { state, kicked: false };
  }

  const strikes = (state.extras[seat]?.afkStrikes ?? 0) + 1;
  let next = patchExtra(state, seat, { afkStrikes: strikes });

  if (strikes >= MATCH_AFK_STRIKES) {
    next = eliminateSeat(
      next,
      seat,
      `${who(player)} missed ${MATCH_AFK_STRIKES} rolls and was kicked. Entry fee is not refunded.`,
    );
    return { state: next, kicked: true };
  }

  if (next.extras[seat]?.inJail) {
    next = stayInJail(next, seat);
  }
  next = {
    ...next,
    log: log(
      next,
      seat,
      `${who(player)} ran out of time (${strikes}/${MATCH_AFK_STRIKES}). Turn passed.`,
    ),
  };
  next = advanceTurn(next, seat);
  return { state: next, kicked: false };
}

export function soleWinner(state: MonopolyPlayState) {
  const alive = state.players.filter((player) => player.status !== "eliminated");
  if (alive.length !== 1) return null;
  const sole = alive[0];
  return {
    seat: sole.position,
    username: sole.username,
    isYou: sole.isYou,
    pot: monopolyPrizePool(state),
  };
}

export function createFreshMonopolyMatch(
  roomId: string,
  you?: { id?: string; username?: string },
): MonopolyPlayState {
  const state = createMonopolyMatchForSeats(roomId, [
    {
      id: you?.id ?? "u_me",
      username: you?.username ?? "You",
      seat: 1,
    },
    ...RIVALS.map((rival, index) => ({
      id: rival.id,
      username: rival.username,
      seat: index + 2,
    })),
  ]);
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      isYou: player.position === 1,
    })),
  };
}

/** Four human seats. `isYou` is assigned on the client from the connected wallet. */
export function createMonopolyMatchForSeats(
  roomId: string,
  seats: { id: string; username: string; seat: number }[],
): MonopolyPlayState {
  const players: MonopolyPlayer[] = [...seats]
    .sort((left, right) => left.seat - right.seat)
    .map((seat) => ({
      id: seat.id,
      username: seat.username,
      position: seat.seat,
      status: "alive" as const,
      cash: MONOPOLY_STARTING_CASH,
      tile: 0,
      owned: 0,
      isYou: false,
    }));

  return {
    roomId,
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    activeSeat: 1,
    turn: 1,
    turnSecondsLeft: MATCH_TURN_SECONDS,
    players,
    owners: {},
    vault: 0,
    extras: {},
    cue: 0,
    log: [
      {
        id: "start",
        seat: null,
        message: "Match started. Four seats. Last player standing wins the pot.",
      },
    ],
  };
}

export function asPlayState(state: MonopolyRoomState): MonopolyPlayState {
  const extra = state as MonopolyPlayState;
  return {
    ...state,
    vault: extra.vault ?? 0,
    extras: extra.extras ?? {},
    cue: extra.cue ?? 0,
  };
}
