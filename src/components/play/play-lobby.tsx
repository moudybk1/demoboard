"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import { PixelArt } from "@/components/game/pixel-art";
import { SeatDots } from "@/components/lobby/seat-dots";
import { PlayArena, PlaySign } from "@/components/play/play-arena";
import { PixelButton } from "@/components/ui/pixel-button";
import { LudoDemo, MonopolyDemo } from "@/components/welcome/game-demos";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { PLAY_ENTRY_FEE, PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import {
  PLAY_LOBBY_SLOTS,
  readPlaySeat,
  type PlayLobbyGame,
} from "@/lib/game/play-table";
import { PLAY_WORLDS } from "@/lib/mock/play";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import {
  rememberPreviewGame,
  type PreviewGame,
} from "@/lib/preview-game";
import { formatBoard, cn } from "@/lib/utils";
import {
  getBoardChainLabel,
  ROBINHOOD_TESTNET_FAUCET,
} from "@/lib/wallet/chains";
import { MAX_PLAYERS_PER_ROOM } from "@/lib/types";
import type { PlaySit } from "@/hooks/use-play-sit";

const EMPTY_GAMES: PlayLobbyGame[] = PLAY_LOBBY_SLOTS.map(emptyLobbyFromSlot);

function emptyLobbyFromSlot(
  slot: (typeof PLAY_LOBBY_SLOTS)[number],
): PlayLobbyGame {
  return {
    tableId: slot.id,
    game: slot.game,
    label: slot.label,
    slot: slot.slot,
    status: "waiting",
    entryFee: PLAY_ENTRY_FEE,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    seated: 0,
    seatsLeft: MAX_PLAYERS_PER_ROOM,
    seats: [],
  };
}

export function PlayLobby({
  initialGame,
  play,
}: {
  initialGame: PreviewGame;
  play: PlaySit;
}) {
  const root = useRef<HTMLElement>(null);
  const { wallet, sit, sitPhase, sitTableId, sitError, switching, switchNetwork } =
    play;
  const [games, setGames] = useState<PlayLobbyGame[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PreviewGame>(initialGame);

  useEffect(() => {
    rememberPreviewGame(selected);
  }, [selected]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/play/lobby");
        const payload = (await response.json()) as {
          games?: PlayLobbyGame[];
          error?: string;
        };
        if (!response.ok || !payload.games) {
          throw new Error(payload.error ?? "Could not load the lobby.");
        }
        if (!cancelled) {
          setGames(payload.games);
          setLoadError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setLoadError(
            caught instanceof Error ? caught.message : "Could not load the lobby.",
          );
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;
    const intro = gsap.timeline();
    const sign = node.querySelector<HTMLElement>("[data-play-sign]");
    const picks = node.querySelectorAll<HTMLElement>("[data-lobby-game]");
    const list = node.querySelector<HTMLElement>("[data-lobby-list]");
    if (sign) {
      intro.from(sign, {
        y: -14,
        duration: 0.45,
        ease: "power3.out",
        clearProps: "transform",
      });
    }
    if (picks.length) {
      intro.from(
        picks,
        {
          y: 16,
          duration: 0.4,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform",
        },
        "-=0.22",
      );
    }
    if (list) {
      intro.from(
        list,
        {
          y: 12,
          duration: 0.35,
          ease: "power3.out",
          clearProps: "transform",
        },
        "-=0.18",
      );
    }
    return () => {
      intro.kill();
    };
  }, []);

  const tables = games ?? EMPTY_GAMES;
  const [refundQueued, setRefundQueued] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRefundQueued(params.get("refund") === "queued");
  }, []);
  const mine = useMemo(() => {
    if (!wallet.address) return null;
    const address = wallet.address.toLowerCase();
    for (const table of tables) {
      const seat = table.seats.find(
        (row) => row.address.toLowerCase() === address,
      );
      if (seat) return { game: table.game, tableId: table.tableId, seat: seat.seat };
    }
    const stored = readPlaySeat();
    if (stored && stored.address.toLowerCase() === address) {
      return { game: selected, tableId: stored.tableId, seat: stored.seat };
    }
    return null;
  }, [tables, wallet.address, selected]);

  const selectedTables = tables.filter((table) => table.game === selected);
  const world = PLAY_WORLDS.find((item) => item.id === selected) ?? PLAY_WORLDS[0];

  return (
    <section
      ref={root}
      aria-label="Play lobby"
      className="relative isolate flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden overflow-y-auto"
    >
      <PlayArena accent={selected} />

      <div className="relative z-[1] mx-auto flex w-full max-w-[44rem] flex-col items-center px-4 pb-24 pt-[4.75rem] sm:pb-10 sm:pt-16">
        <PlaySign label="LOBBY" compact />

        <p className="mt-3 max-w-[42ch] text-center font-pixel text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-void/80">
          Pick a game, then sit any open table. Four seats. Last player standing wins.
        </p>

        {refundQueued ? (
          <p className="mt-3 max-w-md text-center font-pixel text-[10px] uppercase leading-relaxed text-[#5a1e00]">
            You left the table. Your 0.002 ETH refund is queued and will retry when the house wallet has gas.
          </p>
        ) : null}

        <div
          role="listbox"
          aria-label="Game"
          className="mt-5 grid w-full grid-cols-2 gap-3 sm:gap-4"
        >
          {(["monopoly", "ludo"] as const).map((game) => (
            <GamePickCard
              key={game}
              game={game}
              active={selected === game}
              onSelect={() => setSelected(game)}
            />
          ))}
        </div>

        {loadError ? (
          <p className="mt-3 text-center font-pixel text-[10px] uppercase text-[#5a1e00]">
            {loadError} Showing empty tables until this reloads.
          </p>
        ) : null}

        {wallet.isConnected && !wallet.onNetwork ? (
          <div className="mt-4 w-full space-y-2 border-[3px] border-void bg-[#2a160c]/88 px-3 py-3 text-center">
            <p className="font-pixel text-[10px] uppercase text-gold">
              Switch to {getBoardChainLabel()} to sit.
            </p>
            <PixelButton
              type="button"
              size="md"
              variant="primary"
              className="w-full justify-center sm:w-auto"
              disabled={switching}
              onClick={switchNetwork}
            >
              {switching ? "Switching…" : "Switch network"}
            </PixelButton>
          </div>
        ) : null}

        {sitError ? (
          <p className="mt-3 text-center font-pixel text-[10px] uppercase leading-relaxed text-[#5a1e00]">
            {sitError}
          </p>
        ) : null}

        <div data-lobby-list className="mt-5 w-full">
          <div className="pixel-card-shadow-lg">
            <div
              className={cn(
                "pixel-notch border-[4px] border-void p-[3px]",
                selected === "monopoly" ? "bg-[#0b3d52]" : "bg-[#4a1230]",
              )}
            >
              <div className="pixel-notch overflow-hidden bg-[#1a0c06]">
                <div className="flex items-end justify-between gap-3 border-b-[3px] border-void px-3 py-2.5">
                  <div>
                    <p className="font-pixel text-[10px] uppercase tracking-wide text-cream/60">
                      {world.sign} tables
                    </p>
                    <p className="font-pixel text-sm font-bold uppercase text-cream">
                      {world.punch}
                    </p>
                  </div>
                  <p className="shrink-0 font-pixel text-[10px] uppercase text-gold">
                    Sit {formatBoard(PLAY_ENTRY_FEE)} {PLAY_STAKE_SYMBOL}
                  </p>
                </div>
                <ul className="divide-y-[3px] divide-void">
                  {selectedTables.map((table) => (
                    <LobbyTableRow
                      key={table.tableId}
                      table={table}
                      loading={games === null}
                      sitPhase={sitPhase}
                      sitTableId={sitTableId}
                      wallet={wallet}
                      mine={mine}
                      onSit={() => void sit(table.game, table.tableId)}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {!wallet.canEnter && wallet.onNetwork && wallet.chainEnv === "testnet" ? (
          <a
            href={ROBINHOOD_TESTNET_FAUCET}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block text-center font-pixel text-[10px] font-semibold uppercase tracking-wide text-void underline decoration-gold underline-offset-4"
          >
            Get testnet ETH
          </a>
        ) : null}
      </div>
    </section>
  );
}

function GamePickCard({
  game,
  active,
  onSelect,
}: {
  game: PreviewGame;
  active: boolean;
  onSelect: () => void;
}) {
  const monopoly = game === "monopoly";
  const Demo = monopoly ? MonopolyDemo : LudoDemo;
  const world = PLAY_WORLDS.find((item) => item.id === game) ?? PLAY_WORLDS[0];

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-lobby-game
      onClick={onSelect}
      className={cn(
        "min-w-0 text-left transition-[transform,filter] duration-200",
        active ? "brightness-100" : "brightness-[0.78] hover:brightness-95",
      )}
    >
      <div className="pixel-card-shadow-lg">
        <div
          className={cn(
            "pixel-notch border-[4px] border-void p-[3px]",
            active ? (monopoly ? "bg-monopoly" : "bg-ludo") : "bg-[#5a2408]",
          )}
        >
          <div
            className={cn(
              "pixel-notch overflow-hidden",
              monopoly ? "bg-[#0b3d52]" : "bg-[#4a1230]",
            )}
          >
            <div className="pointer-events-none relative mx-auto w-full max-w-[16rem] px-2 pt-2">
              <Demo />
            </div>
            <div className="border-t-[3px] border-void bg-[#1a0c06]/85 px-2.5 py-2">
              <p
                className={cn(
                  "font-pixel text-base font-bold uppercase leading-none tracking-wide sm:text-lg",
                  monopoly ? "text-[#7ad4f0]" : "text-[#ff9ec8]",
                )}
              >
                {world.sign}
              </p>
              <p className="mt-1 font-pixel text-[10px] uppercase leading-snug text-cream/75">
                {world.punch}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function LobbyTableRow({
  table,
  loading,
  sitPhase,
  sitTableId,
  wallet,
  mine,
  onSit,
}: {
  table: PlayLobbyGame;
  loading: boolean;
  sitPhase: PlaySit["sitPhase"];
  sitTableId: string | null;
  wallet: PlaySit["wallet"];
  mine: { game: PreviewGame; tableId: string | null; seat: number } | null;
  onSit: () => void;
}) {
  const router = useRouter();
  const seatedHere = mine?.tableId === table.tableId;
  const seatedElsewhere = Boolean(mine?.tableId) && mine?.tableId !== table.tableId;
  const sittingThis = sitPhase !== "idle" && sitTableId === table.tableId;
  const inPlay = table.status === "playing";
  const full = table.seatsLeft <= 0 && !seatedHere;
  const busy = sitPhase !== "idle";
  const ticker = wallet.symbol;

  let action: ReactNode;
  if (inPlay && !seatedHere) {
    action = (
      <span className="font-pixel text-[10px] uppercase text-gold">In play</span>
    );
  } else if (full) {
    action = (
      <span className="font-pixel text-[10px] uppercase text-gold">Full</span>
    );
  } else if (seatedHere && mine?.tableId) {
    action = (
      <PixelButton
        type="button"
        size="sm"
        variant={table.game === "monopoly" ? "monopoly" : "ludo"}
        onClick={() => router.push(`/room/${mine.tableId}`)}
      >
        Open
      </PixelButton>
    );
  } else if (!wallet.onNetwork) {
    action = (
      <span className="font-pixel text-[10px] uppercase text-cream/55">Network</span>
    );
  } else if (seatedElsewhere) {
    action = (
      <span className="font-pixel text-[10px] uppercase text-gold">Seated</span>
    );
  } else if (wallet.error) {
    action = (
      <span className="font-pixel text-[10px] uppercase text-gold">No RPC</span>
    );
  } else if (wallet.canEnter) {
    action = (
      <PixelButton
        type="button"
        size="sm"
        variant={table.game === "monopoly" ? "monopoly" : "ludo"}
        disabled={busy}
        onClick={onSit}
      >
        {sittingThis && sitPhase === "sending"
          ? "Wallet…"
          : sittingThis && sitPhase === "confirming"
            ? "Chain…"
            : sittingThis && sitPhase === "seating"
              ? "Sit…"
              : "Sit"}
      </PixelButton>
    );
  } else {
    action = (
      <span className="font-pixel text-[10px] uppercase text-gold">
        Need {formatBoard(wallet.entryFee)} {ticker}
      </span>
    );
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2.5 sm:gap-3">
      <div className="flex w-16 shrink-0 items-end gap-0.5 sm:w-[4.5rem]">
        {Array.from({ length: table.maxPlayers }, (_, index) => {
          const seat = index + 1;
          const filled = table.seats.some((row) => row.seat === seat);
          return (
            <span
              key={seat}
              className={cn("w-3.5 sm:w-4", !filled && "opacity-30")}
              title={filled ? `Seat ${seat} taken` : `Seat ${seat} open`}
            >
              <PixelArt sprite={pawnSprite(seat)} />
            </span>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-pixel text-sm font-bold uppercase leading-none text-cream">
          {table.label}
        </p>
        <p className="mt-1 font-pixel text-[10px] uppercase tracking-wide text-cream/60">
          {loading ? "…" : `${table.seated}/${table.maxPlayers} sitting`}
          <span className="sm:hidden">
            {" "}
            · {formatBoard(table.entryFee)} {PLAY_STAKE_SYMBOL}
          </span>
        </p>
      </div>

      <p className="hidden shrink-0 font-pixel text-xs font-bold tabular-nums text-gold sm:block">
        {formatBoard(table.entryFee)} {PLAY_STAKE_SYMBOL}
      </p>

      <div className="hidden shrink-0 sm:block">
        <SeatDots filled={table.seated} total={table.maxPlayers} />
      </div>

      <div className="shrink-0">{action}</div>
    </li>
  );
}
