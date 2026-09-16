"use client";

import { useMemo, useState } from "react";
import type { Connector } from "wagmi";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";

import { useAuthMe } from "@/hooks/use-auth-me";
import { PixelButton } from "@/components/ui/pixel-button";
import {
  getBoardChainId,
  ROBINHOOD_CHAIN_LABEL,
  shortenAddress,
} from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

type WalletOption = {
  match: (connector: Connector) => boolean;
  id: string;
  label: string;
  hint: string;
  installUrl?: string;
};

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "metaMask",
    label: "MetaMask",
    hint: "Browser extension",
    installUrl: "https://metamask.io/download",
    match: (c) =>
      c.id === "metaMask" ||
      c.id === "metaMaskSDK" ||
      c.name.toLowerCase().includes("metamask"),
  },
  {
    id: "okx",
    label: "OKX Wallet",
    hint: "Browser extension",
    installUrl: "https://www.okx.com/download",
    match: (c) => c.id === "okx" || c.name.toLowerCase().includes("okx"),
  },
  {
    id: "rabby",
    label: "Rabby",
    hint: "Browser extension",
    installUrl: "https://rabby.io",
    match: (c) => c.id === "rabby" || c.name.toLowerCase().includes("rabby"),
  },
  {
    id: "browser",
    label: "Browser wallet",
    hint: "Any other EVM extension",
    match: (c) =>
      c.id === "browser" ||
      (c.type === "injected" &&
        !/metamask|okx|rabby/i.test(`${c.id} ${c.name}`)),
  },
  {
    id: "walletConnect",
    label: "WalletConnect",
    hint: "Mobile & more wallets",
    installUrl: "https://walletconnect.com",
    match: (c) =>
      c.id === "walletConnect" || c.type === "walletConnect",
  },
];

/**
 * Wallet-only sign-in: pick wallet → connect → switch network → sign → session.
 */
export function WalletConnectPanel({
  className,
  onSignedIn,
  compact,
}: {
  className?: string;
  onSignedIn?: () => void;
  /** Tighter spacing for modal use. */
  compact?: boolean;
}) {
  const expectedChainId = getBoardChainId();
  const { address, isConnected, isConnecting, chainId, status } = useAccount();
  const { connectAsync, connectors, isPending: isConnectPending, error: connectError } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const { signMessageAsync, isPending: isSignPending } = useSignMessage();
  const { authenticated, wallet, refresh } = useAuthMe();

  const [busy, setBusy] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wrongNetwork =
    isConnected && typeof chainId === "number" && chainId !== expectedChainId;

  const walletRows = useMemo(() => {
    return WALLET_OPTIONS.map((option) => {
      const connector = connectors.find(option.match);
      return { option, connector };
    }).filter((row) => row.connector || row.option.id !== "walletConnect");
  }, [connectors]);

  const signedInHere =
    authenticated &&
    wallet?.address &&
    address &&
    wallet.address.toLowerCase() === address.toLowerCase();

  async function handleConnect(connector: Connector, label: string) {
    setError(null);
    setPendingWallet(label);
    try {
      await connectAsync({ connector, chainId: expectedChainId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open wallet.";
      if (/reject|denied|cancel/i.test(message)) {
        setError("Connection cancelled in wallet.");
      } else {
        setError(message);
      }
    } finally {
      setPendingWallet(null);
    }
  }

  async function handleSwitch() {
    setError(null);
    try {
      await switchChainAsync({ chainId: expectedChainId });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not switch network. Add Robinhood Chain in your wallet.",
      );
    }
  }

  async function handleSignIn() {
    if (!address) return;
    setBusy(true);
    setError(null);

    try {
      const challengeRes = await fetch("/api/auth/wallet/challenge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const challengeBody = (await challengeRes.json()) as {
        error?: string;
        message?: string;
      };
      if (!challengeRes.ok || !challengeBody.message) {
        throw new Error(challengeBody.error || "Failed to start wallet login.");
      }

      const signature = await signMessageAsync({
        message: challengeBody.message,
      });

      const loginRes = await fetch("/api/auth/wallet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          message: challengeBody.message,
        }),
      });
      const loginBody = (await loginRes.json()) as { error?: string };
      if (!loginRes.ok) {
        throw new Error(loginBody.error || "Wallet sign-in failed.");
      }

      await refresh();
      onSignedIn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  const waiting =
    busy ||
    isConnecting ||
    isConnectPending ||
    isSwitchPending ||
    isSignPending ||
    status === "reconnecting" ||
    pendingWallet !== null;

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className={cn("space-y-4", compact ? "p-0" : "p-1")}>
        {signedInHere ? (
          <>
            <div className="border-2 border-success/40 bg-success/5 p-3">
              <p className="font-pixel text-xs uppercase text-success">
                Signed in
              </p>
              <p className="mt-2 break-all font-mono text-xs text-parchment">
                {address}
              </p>
              <p className="mt-2 text-xs text-muted">
                Your profile is this wallet on {ROBINHOOD_CHAIN_LABEL}.
              </p>
            </div>
            <PixelButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect extension
            </PixelButton>
          </>
        ) : null}

        {!signedInHere && !isConnected ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Choose a wallet on {ROBINHOOD_CHAIN_LABEL}. Sign once — no gas —
              and your BOARD profile is this address.
            </p>
            <ul className="space-y-2">
              {walletRows.map(({ option, connector }) => {
                const available = Boolean(connector);
                const isPending = pendingWallet === option.label;

                if (!available) {
                  return (
                    <li key={option.id}>
                      <div className="flex w-full items-center gap-3 border-2 border-edge bg-ink/40 px-3 py-3 opacity-70">
                        <WalletGlyph id={option.id} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-pixel text-[10px] uppercase tracking-wide text-parchment">
                            {option.label}
                          </span>
                          <span className="mt-1 block font-pixel text-xs uppercase tracking-wider text-faint">
                            Not detected
                          </span>
                        </span>
                        {option.installUrl ? (
                          <a
                            href={option.installUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-pixel text-xs uppercase text-muted underline-offset-2 hover:text-gold hover:underline"
                          >
                            Install
                          </a>
                        ) : null}
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={waiting}
                      onClick={() => {
                        void handleConnect(connector!, option.label);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 border-2 border-edge-bright bg-surface-raised px-3 py-3 text-left transition-colors",
                        "hover:border-gold/60 hover:bg-gold/5",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      <WalletGlyph id={option.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-pixel text-[10px] uppercase tracking-wide text-parchment">
                          {option.label}
                        </span>
                        <span className="mt-1 block font-pixel text-xs uppercase tracking-wider text-faint">
                          {isPending ? "Opening…" : option.hint}
                        </span>
                      </span>
                      <span className="font-pixel text-xs uppercase text-gold">
                        {isPending ? "…" : "Select"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {!signedInHere && isConnected && wrongNetwork ? (
          <>
            <div role="alert" className="border-2 border-gold/50 bg-gold/5 p-3">
              <p className="font-pixel text-xs uppercase text-gold">
                Wrong network
              </p>
              <p className="mt-2 text-sm text-muted">
                Switch to {ROBINHOOD_CHAIN_LABEL} (chain ID {expectedChainId}).
              </p>
            </div>
            <PixelButton
              type="button"
              size="lg"
              onClick={() => void handleSwitch()}
              disabled={waiting}
              className="w-full"
            >
              {isSwitchPending ? "Switching…" : "Switch network"}
            </PixelButton>
            <PixelButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              className="w-full"
            >
              Use a different wallet
            </PixelButton>
          </>
        ) : null}

        {!signedInHere && isConnected && !wrongNetwork ? (
          <>
            <div className="border-2 border-edge bg-surface/40 p-3">
              <p className="font-pixel text-xs uppercase text-gold">
                Wallet ready
              </p>
              <p className="mt-2 break-all font-mono text-xs text-parchment">
                {address}
              </p>
              <p className="mt-2 text-xs text-muted">
                Sign a message to create or resume your BOARD profile. No gas.
              </p>
            </div>
            <PixelButton
              type="button"
              size="lg"
              onClick={() => void handleSignIn()}
              disabled={waiting}
              className="w-full"
            >
              {busy || isSignPending ? "Sign to continue…" : "Sign in"}
            </PixelButton>
            <PixelButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              className="w-full"
            >
              Use a different wallet
            </PixelButton>
          </>
        ) : null}

        {(error || connectError) && (
          <p role="alert" className="text-sm text-danger">
            {error || connectError?.message}
          </p>
        )}

        {authenticated && wallet && !signedInHere && address ? (
          <p className="text-xs text-muted">
            Signed in as {shortenAddress(wallet.address)}. Connected extension
            differs — sign in again to switch profiles.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function WalletGlyph({ id }: { id: string }) {
  const letter =
    id === "metaMask"
      ? "M"
      : id === "okx"
        ? "O"
        : id === "rabby"
          ? "R"
          : id === "walletConnect"
            ? "W"
            : "E";

  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center border-2 border-edge bg-ink font-pixel text-[11px] text-gold"
    >
      {letter}
    </span>
  );
}
