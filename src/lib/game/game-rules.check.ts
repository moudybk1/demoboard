import type { DiceRoll } from "@/lib/game/dice";
import { BOARD_TILES } from "@/lib/game/monopoly-board";
import {
  applyRollMove,
  buyTile,
  createFreshMonopolyMatch,
  GO_SALARY,
  groupComplete,
  JAIL_FINE,
  JAIL_TILE,
  leaveJailByFine,
  rentDue,
  resolveCardMove,
  resolveLanding,
  sendToJail,
} from "@/lib/game/monopoly-rules";
import { trackCellForSeat } from "@/lib/game/ludo-geometry";
import {
  findCaptures,
  grantsExtraTurn,
  movablePawns,
  previewMove,
  registerSixRoll,
} from "@/lib/game/ludo-rules";
import { createFreshLudoMatch } from "@/lib/mock/ludo";

function roll(a: 1 | 2 | 3 | 4 | 5 | 6, b: 1 | 2 | 3 | 4 | 5 | 6): DiceRoll {
  return { dice: [a, b], total: a + b, isDouble: a === b };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function checkMonopoly() {
  const state = createFreshMonopolyMatch("MNP-TEST");
  assert(state.players.length === 4, "four seats");
  assert(
    state.players.every((player) => player.cash === 1500 && player.tile === 0),
    "start cash/go",
  );
  assert(state.activeSeat === 1, "you start");

  const moved = applyRollMove(state, 1, roll(2, 3));
  assert(moved.to === 5, `Cairo Airport is tile 5, got ${moved.to}`);
  const land = resolveLanding(moved.state, 1, false);
  assert(land.pendingBuy === 5, "unowned airport is buyable");
  const bought = buyTile(land.state, 1, 5);
  assert(bought, "can buy airport");
  assert(bought.owners[5] === 1, "you own airport");

  const rivalOnAirport = {
    ...bought,
    players: bought.players.map((player) =>
      player.position === 2 ? { ...player, tile: 5 } : player,
    ),
  };
  const rent = resolveLanding(rivalOnAirport, 2, false);
  assert(rent.rent?.due === 25, `one airport rent is 25, got ${rent.rent?.due}`);

  const goLand = resolveLanding(
    {
      ...state,
      players: state.players.map((player) =>
        player.position === 1 ? { ...player, tile: 0 } : player,
      ),
    },
    1,
    false,
  );
  const you = goLand.state.players.find((player) => player.position === 1);
  assert(you?.cash === 1500 + GO_SALARY, "landing on GO pays salary once");

  const fromChance = {
    ...state,
    players: state.players.map((player) =>
      player.position === 1 ? { ...player, tile: 7 } : player,
    ),
  };
  let afterCard = resolveCardMove(fromChance, 1, {
    text: "Advance to GO. Collect 200.",
    go: true,
  });
  const movedByCard = afterCard.players.find((player) => player.position === 1);
  assert(movedByCard?.tile === 0, "Advance to GO lands on GO");
  afterCard = resolveLanding(afterCard, 1, false).state;
  const afterGo = afterCard.players.find((player) => player.position === 1);
  assert(
    afterGo?.cash === 1500 + GO_SALARY,
    `Advance to GO pays salary once, got ${afterGo?.cash}`,
  );

  let doubles = state;
  doubles = applyRollMove(doubles, 1, roll(1, 1)).state;
  doubles = applyRollMove(doubles, 1, roll(2, 2)).state;
  const third = applyRollMove(doubles, 1, roll(3, 3));
  assert(third.goToJail, "three doubles go to jail");
  assert(third.to === JAIL_TILE, "jailed on jail tile");

  const jailed = sendToJail(state, 1);
  const freed = leaveJailByFine(jailed, 1);
  assert(freed, "can pay jail fine");
  assert(freed.players[0]?.cash === 1500 - JAIL_FINE, "fine deducted");
  assert(!freed.extras[1]?.inJail, "left jail");

  const cairo = BOARD_TILES[1];
  assert(cairo?.kind === "country", "tile 1 is Cairo");
  const owned = {
    ...state,
    owners: { 1: 2, 3: 2 },
    players: state.players.map((player) =>
      player.position === 2
        ? { ...player, owned: 2 }
        : player.position === 1
          ? { ...player, tile: 1 }
          : player,
    ),
  };
  assert(groupComplete(owned, 2, "ancient"), "ancient group complete");
  assert(
    rentDue(owned, cairo, 2) === (cairo.rent ?? 0) * 2,
    "monopoly doubles rent",
  );

  const broke = {
    ...state,
    owners: { 46: 2 },
    players: state.players.map((player) =>
      player.position === 1 ? { ...player, cash: 10, tile: 46 } : player,
    ),
  };
  const bust = resolveLanding(broke, 1, false);
  assert(bust.rent?.bankrupted, "cannot cover rent → bankrupt");
  assert(
    bust.state.players.find((player) => player.position === 1)?.status ===
      "eliminated",
    "bankrupt player is out",
  );
}

function checkLudo() {
  const match = createFreshLudoMatch("LUD-TEST");
  const you = match.players[0];
  assert(you, "you exist");
  assert(
    you.pawns.every((pawn) => pawn.status === "yard"),
    "all pawns start in yard",
  );
  assert(movablePawns(match, you, 5).length === 0, "need a 6 to leave the yard");
  assert(movablePawns(match, you, 6).length === 4, "any yard pawn may exit on 6");

  const first = registerSixRoll(0);
  const second = registerSixRoll(first.nextCount);
  const third = registerSixRoll(second.nextCount);
  assert(!first.voided && !second.voided && third.voided, "third 6 voids the turn");

  const target = trackCellForSeat(1, 4);
  let rivalSteps = 0;
  for (let steps = 0; steps < 56; steps += 1) {
    const cell = trackCellForSeat(2, steps);
    if (cell[0] === target[0] && cell[1] === target[1]) {
      rivalSteps = steps;
      break;
    }
  }

  const onTrack = {
    ...match,
    players: match.players.map((player) => {
      if (player.position === 1) {
        return {
          ...player,
          pawns: player.pawns.map((pawn, index) =>
            index === 0 ? { ...pawn, status: "track" as const, steps: 3 } : pawn,
          ),
        };
      }
      if (player.position === 2) {
        return {
          ...player,
          pawns: player.pawns.map((pawn, index) =>
            index === 0
              ? { ...pawn, status: "track" as const, steps: rivalSteps }
              : pawn,
          ),
        };
      }
      return player;
    }),
  };
  const mover = onTrack.players.find((player) => player.position === 1);
  assert(mover, "mover");
  const hop = previewMove(onTrack, 1, mover.pawns[0]!, 1);
  assert(hop, "can step onto the rival");
  const hits = findCaptures(onTrack, 1, hop.next);
  assert(hits.length === 1, "unsafe landing captures a singleton");

  const homePawn = { ...you.pawns[0]!, status: "home" as const, steps: 4 };
  assert(previewMove(match, 1, homePawn, 1)?.next.status === "finished", "exact 1 from last home cell finishes");
  assert(previewMove(match, 1, homePawn, 2) === null, "overshoot from home is illegal");

  assert(
    grantsExtraTurn({ roll: 6, movedPawn: hop.next, captured: false }),
    "6 extra",
  );
  assert(
    grantsExtraTurn({
      roll: 2,
      movedPawn: { ...hop.next, status: "finished" },
      captured: false,
    }),
    "finish extra",
  );
  assert(
    grantsExtraTurn({ roll: 2, movedPawn: hop.next, captured: true }),
    "capture extra",
  );
}

checkMonopoly();
checkLudo();
console.log("game rule checks passed");
