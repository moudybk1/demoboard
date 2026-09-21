"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { parseEther } from "viem";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePublicClient, useSendTransaction, useSwitchChain } from "wagmi";

import { useSignIn } from "@/components/account/sign-in-provider";
import { PixelArt } from "@/components/game/pixel-art";
import { PixelButton } from "@/components/ui/pixel-button";
import { BoardAmount } from "@/components/ui/board-amount";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import {
  PLAY_CHEST,
  PLAY_SPARKLE,
  PLAY_TORCH,
} from "@/lib/game/play-sprites";
import { PLAY_ENTRY_FEE_ETH, savePlayPlayer } from "@/lib/game/play-player";
import { savePlaySeat } from "@/lib/game/play-table";
import { PLAY_WORLDS, type PlayWorld } from "@/lib/mock/play";
import { prefersReducedMotion } from "@/lib/motion/gsap-config";
import {
  playPathForGame,
  rememberPreviewGame,
  type PreviewGame,
} from "@/lib/preview-game";
import { useBoardTokenBalance } from "@/hooks/use-board-token-balance";
import {
  getBoardChainLabel,
  ROBINHOOD_TESTNET_FAUCET,
  shortenAddress,
} from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

type PlayStageProps = {
  initialGame: PreviewGame;
};

/**
 * Play client: coliseum, hanging wooden sign, framed table, wallet gate.
 */
export function PlayStage({ initialGame }: PlayStageProps) {
  const router = useRouter();
  const { openSignIn } = useSignIn();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const wallet = useBoardTokenBalance();
  const [sitPhase, setSitPhase] = useState<
    "idle" | "sending" | "confirming" | "seating"
  >("idle");
  const [sitError, setSitError] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const pointerStart = useRef<number | null>(null);
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      PLAY_WORLDS.findIndex((world) => world.id === initialGame),
    ),
  );
  const world = PLAY_WORLDS[index] ?? PLAY_WORLDS[0];

  const showWorld = useCallback(
    (nextIndex: number) => {
      const wrapped = (nextIndex + PLAY_WORLDS.length) % PLAY_WORLDS.length;
      const next = PLAY_WORLDS[wrapped];
      if (!next) return;
      setIndex(wrapped);
      rememberPreviewGame(next.id);
      router.replace(playPathForGame(next.id), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    rememberPreviewGame(world.id);
  }, [world.id]);

  useEffect(() => {
    const node = root.current;
    if (!node || prefersReducedMotion()) return;
    const intro = gsap.timeline();
    const sign = node.querySelector<HTMLElement>("[data-play-sign]");
    const frame = node.querySelector<HTMLElement>("[data-play-frame]");
    if (sign) {
      intro.from(sign, {
        y: -16,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform",
      });
    }
    if (frame) {
      intro.from(
        frame,
        {
          y: 14,
          duration: 0.4,
          ease: "power3.out",
          clearProps: "transform",
        },
        "-=0.28",
      );
    }
    return () => {
      intro.kill();
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showWorld(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showWorld(index + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, showWorld]);

  async function enterMatch() {
    if (!wallet.address || !wallet.canEnter || sitPhase !== "idle") return;
    setSitError(null);
    try {
      setSitPhase("sending");
      const configResponse = await fetch("/api/play/config");
      const config = (await configResponse.json()) as {
        treasury?: `0x${string}`;
        error?: string;
      };
      if (!configResponse.ok || !config.treasury) {
        throw new Error(config.error ?? "Play treasury is not ready.");
      }

      const hash = await sendTransactionAsync({
        to: config.treasury,
        value: parseEther(PLAY_ENTRY_FEE_ETH),
        chainId: wallet.expectedChainId,
      });

      setSitPhase("confirming");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setSitPhase("seating");
      savePlayPlayer(wallet.address);
      const sitResponse = await fetch("/api/play/sit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: world.id,
          address: wallet.address,
          txHash: hash,
        }),
      });
      const sit = (await sitResponse.json()) as {
        table?: { id: string };
        seat?: number;
        leaveToken?: string;
        error?: string;
      };
      if (!sitResponse.ok || !sit.table || !sit.leaveToken || sit.seat == null) {
        throw new Error(sit.error ?? "Could not sit at the table.");
      }

      savePlaySeat({
        tableId: sit.table.id,
        address: wallet.address,
        seat: sit.seat,
        leaveToken: sit.leaveToken,
      });
      rememberPreviewGame(world.id);
      router.push(`/room/${sit.table.id}`);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not sit at the table.";
      setSitError(message);
      setSitPhase("idle");
    }
  }

  return (
    <section
      ref={root}
      aria-label="Play BOARD"
      className="relative isolate flex min-h-[100dvh] flex-1 flex-col overflow-hidden"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") return;
        pointerStart.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStart.current == null) return;
        const delta = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(delta) < 48) return;
        showWorld(delta < 0 ? index + 1 : index - 1);
      }}
    >
      <PlayArena world={world} />

      <div className="relative z-[1] flex min-h-[100dvh] flex-col items-center justify-end px-4 pb-[4.5rem] pt-16 sm:justify-center sm:pb-8 sm:pt-10">
        <PlaySign world={world} />

        <div className="mt-3 flex w-full max-w-[28rem] items-center gap-2 sm:mt-4">
          <PixelButton
            type="button"
            size="lg"
            variant="outline"
            className="shrink-0 px-3"
            aria-label="Previous game"
            onClick={() => showWorld(index - 1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </PixelButton>

          <div data-play-frame className="min-w-0 flex-1">
            <PlayFrame
              world={world}
              wallet={wallet}
              switching={switching}
              sitPhase={sitPhase}
              sitError={sitError}
              onConnect={openSignIn}
              onSwitch={() => void switchChainAsync({ chainId: wallet.expectedChainId })}
              onEnter={() => void enterMatch()}
            />
          </div>

          <PixelButton
            type="button"
            size="lg"
            variant="outline"
            className="shrink-0 px-3"
            aria-label="Next game"
            onClick={() => showWorld(index + 1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </PixelButton>
        </div>

        <div
          role="tablist"
          aria-label="Games"
          className="mt-4 flex items-center justify-center gap-2"
        >
          {PLAY_WORLDS.map((item, itemIndex) => {
            const selected = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={item.sign}
                className={cn(
                  "size-3 border-[3px] border-void transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:translate-y-px",
                  selected ? "bg-gold" : "bg-cream",
                )}
                onClick={() => showWorld(itemIndex)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlayFrame({
  world,
  wallet,
  switching,
  sitPhase,
  sitError,
  onConnect,
  onSwitch,
  onEnter,
}: {
  world: PlayWorld;
  wallet: ReturnType<typeof useBoardTokenBalance>;
  switching: boolean;
  sitPhase: "idle" | "sending" | "confirming" | "seating";
  sitError: string | null;
  onConnect: () => void;
  onSwitch: () => void;
  onEnter: () => void;
}) {
  return (
    <div className="pixel-card-shadow-lg">
      <div className="pixel-notch border-[4px] border-void bg-[#5a2408] p-[4px]">
        <div
          className={cn(
            "pixel-notch relative overflow-hidden",
            world.id === "monopoly" ? "bg-[#0b3d52]" : "bg-[#4a1230]",
          )}
        >
          <div className="relative flex aspect-[5/4] flex-col items-center justify-center gap-2 px-4 pt-5">
            <span className="w-16 sm:w-20" aria-hidden>
              <PixelArt sprite={PLAY_CHEST} />
            </span>
            <div className="flex items-end gap-2">
              <span className="w-9 sm:w-10">
                <PixelArt sprite={pawnSprite(world.seat)} />
              </span>
              <span className="w-8 sm:w-9">
                <PixelArt sprite={pawnSprite(((world.seat + 1) % 4) + 1)} />
              </span>
              <span className="w-8 sm:w-9">
                <PixelArt sprite={pawnSprite(((world.seat + 2) % 4) + 1)} />
              </span>
            </div>
            <p className="max-w-[22ch] text-center font-pixel text-[10px] font-semibold uppercase leading-snug tracking-wide text-cream/80">
              {world.quote}
            </p>
          </div>

          <div className="border-t-[3px] border-void bg-[#1a0c06]/80 px-3 py-3">
            <PlayFrameAction
              world={world}
              wallet={wallet}
              switching={switching}
              sitPhase={sitPhase}
              sitError={sitError}
              onConnect={onConnect}
              onSwitch={onSwitch}
              onEnter={onEnter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayFrameAction({
  world,
  wallet,
  switching,
  sitPhase,
  sitError,
  onConnect,
  onSwitch,
  onEnter,
}: {
  world: PlayWorld;
  wallet: ReturnType<typeof useBoardTokenBalance>;
  switching: boolean;
  sitPhase: "idle" | "sending" | "confirming" | "seating";
  sitError: string | null;
  onConnect: () => void;
  onSwitch: () => void;
  onEnter: () => void;
}) {
  if (!wallet.isConnected) {
    return (
      <PixelButton
        type="button"
        size="lg"
        variant="primary"
        className="w-full justify-center"
        onClick={onConnect}
      >
        Connect Wallet
      </PixelButton>
    );
  }

  if (!wallet.onNetwork) {
    return (
      <div className="space-y-2">
        <p className="text-center font-pixel text-[10px] uppercase text-gold">
          Switch to {getBoardChainLabel()}
        </p>
        <PixelButton
          type="button"
          size="lg"
          variant="primary"
          className="w-full justify-center"
          disabled={switching}
          onClick={onSwitch}
        >
          {switching ? "Switching…" : "Switch network"}
        </PixelButton>
      </div>
    );
  }

  const ticker = wallet.symbol;
  const shortLabel = wallet.shortfall.toFixed(3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 font-pixel text-[10px] uppercase text-cream/80">
        <span>{wallet.address ? shortenAddress(wallet.address) : "Wallet"}</span>
        {wallet.amount !== null ? (
          <BoardAmount
            value={wallet.amount}
            size="xs"
            tone="gold"
            ticker={ticker}
            className="text-gold"
          />
        ) : (
          <span>{wallet.loading ? "Reading…" : "—"}</span>
        )}
      </div>
      {wallet.error ? (
        <p className="text-center font-pixel text-[10px] uppercase leading-relaxed text-gold">
          Could not read {ticker}. Check the RPC and try again.
        </p>
      ) : wallet.canEnter ? (
        <PixelButton
          type="button"
          size="lg"
          variant="primary"
          className="w-full justify-center"
          disabled={sitPhase !== "idle"}
          onClick={onEnter}
        >
          {sitPhase === "sending"
            ? "Confirm in wallet…"
            : sitPhase === "confirming"
              ? "Waiting for chain…"
              : sitPhase === "seating"
                ? "Sitting…"
                : `Sit · ${wallet.entryFee} ${ticker}`}
        </PixelButton>
      ) : (
        <p className="text-center font-pixel text-[10px] uppercase leading-relaxed text-gold">
          Need{" "}
          <BoardAmount
            value={wallet.entryFee}
            size="xs"
            tone="gold"
            ticker={ticker}
          />{" "}
          to sit.
          {wallet.shortfall > 0 ? <> Short {shortLabel}.</> : null}
        </p>
      )}
      {sitError ? (
        <p className="text-center font-pixel text-[10px] uppercase leading-relaxed text-gold">
          {sitError}
        </p>
      ) : null}
      {!wallet.canEnter && wallet.chainEnv === "testnet" ? (
        <a
          href={ROBINHOOD_TESTNET_FAUCET}
          target="_blank"
          rel="noreferrer"
          className="block text-center font-pixel text-[10px] font-semibold uppercase tracking-wide text-cream underline decoration-gold underline-offset-4"
        >
          Get testnet ETH
        </a>
      ) : null}
    </div>
  );
}

function PlaySign({ world }: { world: PlayWorld }) {
  return (
    <div data-play-sign className="relative w-full max-w-[18rem] sm:max-w-[22rem]">
      <span
        aria-hidden
        className="absolute left-[28%] top-0 h-7 w-[5px] bg-void sm:h-8"
      />
      <span
        aria-hidden
        className="absolute right-[28%] top-0 h-7 w-[5px] bg-void sm:h-8"
      />
      <PlaySparkle className="absolute -left-2 top-8" delay="0ms" />
      <PlaySparkle className="absolute -right-3 top-4" delay="400ms" />

      <div className="relative mx-auto mt-7 w-full sm:mt-8">
        <div className="pixel-card-shadow-lg">
          <div className="pixel-notch border-[4px] border-void bg-[#8a3200] p-[3px]">
            <div
              className="pixel-notch relative overflow-hidden px-4 py-2.5 sm:px-5 sm:py-3"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    90deg,
                    #e39a3a 0 12px,
                    #d4892a 12px 14px,
                    #c77822 14px 26px
                  )
                `,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-cream/35"
              />
              <h1
                className="text-center font-pixel font-bold leading-none tracking-wide text-gold"
                style={{
                  fontSize:
                    world.id === "ludo"
                      ? "clamp(2.4rem, 10vw, 3.6rem)"
                      : "clamp(1.7rem, 7vw, 2.7rem)",
                  textShadow: "3px 3px 0 #c45a00, 5px 5px 0 #1a0c06",
                }}
              >
                {world.sign}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayArena({ world }: { world: PlayWorld }) {
  const crowd = [1, 2, 3, 4, 2, 1, 4, 3, 1, 3, 2, 4];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div
        className="absolute inset-x-0 top-0 h-[42%]"
        style={{
          background:
            "linear-gradient(#7ec8ff 0%, #b8e0ff 55%, #e8f4ff 100%)",
        }}
      />
      <span className="absolute left-[12%] top-[8%] size-16 rounded-full bg-cream/80" />
      <span className="absolute right-[18%] top-[12%] h-10 w-24 rounded-full bg-cream/70" />
      <span className="absolute left-[38%] top-[6%] h-8 w-20 rounded-full bg-cream/60" />

      <div
        className="absolute inset-x-0 bottom-0 h-[62%]"
        style={{
          background:
            "linear-gradient(#c7783a 0%, #d4893a 18%, #e0a05a 42%, #c9843c 100%)",
        }}
      />

      <div className="absolute inset-x-[6%] bottom-[34%] h-[28%] sm:inset-x-[10%]">
        <div
          className="absolute inset-0 border-x-[6px] border-t-[6px] border-void"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                #b85a32 0 14px,
                #9a4624 14px 16px,
                #c46838 16px 30px
              )
            `,
            clipPath: "polygon(8% 100%, 18% 0, 82% 0, 92% 100%)",
          }}
        />
        <div className="absolute inset-x-[16%] top-[18%] flex justify-between px-2">
          {crowd.slice(0, 6).map((seat, i) => (
            <span key={`top-${i}`} className="w-6 sm:w-7">
              <PixelArt sprite={pawnSprite(seat)} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-[10%] bottom-[8%] flex justify-between px-1">
          {crowd.slice(6).map((seat, i) => (
            <span key={`mid-${i}`} className="w-7 sm:w-8">
              <PixelArt sprite={pawnSprite(seat)} />
            </span>
          ))}
        </div>
      </div>

      <span className="absolute bottom-[22%] left-[8%] w-7 sm:left-[12%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[22%] right-[8%] w-7 sm:right-[12%] sm:w-8">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[18%] left-[22%] w-7 opacity-80">
        <PixelArt sprite={PLAY_TORCH} />
      </span>
      <span className="absolute bottom-[18%] right-[22%] w-7 opacity-80">
        <PixelArt sprite={PLAY_TORCH} />
      </span>

      <div
        className={cn(
          "absolute bottom-0 left-1/2 h-[8%] w-[min(18rem,70%)] -translate-x-1/2 border-[3px] border-void",
          world.id === "monopoly" ? "bg-monopoly/40" : "bg-ludo/40",
        )}
      />
    </div>
  );
}

function PlaySparkle({
  className,
  delay,
}: {
  className?: string;
  delay: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("w-4 animate-blink sm:w-5", className)}
      style={{ animationDelay: delay }}
    >
      <PixelArt sprite={PLAY_SPARKLE} />
    </span>
  );
}
