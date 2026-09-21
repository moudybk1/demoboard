"use client";

import { useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";

import { useAuthMe } from "@/hooks/use-auth-me";
import { PixelButton } from "@/components/ui/pixel-button";
import {
  getBoardChainId,
  getBoardChainLabel,
  shortenAddress,
} from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

/**
 * Wallet-only BOARD session: RainbowKit connect → switch network → sign → cookie.
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
  const { openConnectModal } = useConnectModal();
  const { address, isConnected, isConnecting, chainId, status } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const { signMessageAsync, isPending: isSignPending } = useSignMessage();
  const { authenticated, wallet, refresh } = useAuthMe();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrongNetwork =
    isConnected && typeof chainId === "number" && chainId !== expectedChainId;

  const signedInHere =
    authenticated &&
    wallet?.address &&
    address &&
    wallet.address.toLowerCase() === address.toLowerCase();

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
    isSwitchPending ||
    isSignPending ||
    status === "reconnecting";

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
                Your profile is this wallet on {getBoardChainLabel()}.
              </p>
            </div>
            <PixelButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect wallet
            </PixelButton>
          </>
        ) : null}

        {!signedInHere && !isConnected ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Connect a wallet on {getBoardChainLabel()}. Sign once, with no
              gas, and your BOARD profile is this address.
            </p>
            <PixelButton
              type="button"
              size="lg"
              className="w-full"
              onClick={() => openConnectModal?.()}
              disabled={waiting || !openConnectModal}
            >
              {waiting ? "Opening…" : "Connect Wallet"}
            </PixelButton>
          </>
        ) : null}

        {!signedInHere && isConnected && wrongNetwork ? (
          <>
            <div role="alert" className="border-2 border-gold/50 bg-gold/5 p-3">
              <p className="font-pixel text-xs uppercase text-gold">
                Wrong network
              </p>
              <p className="mt-2 text-sm text-muted">
                Switch to {getBoardChainLabel()} (chain ID {expectedChainId}).
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

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        {authenticated && wallet && !signedInHere && address ? (
          <p className="text-xs text-muted">
            Signed in as {shortenAddress(wallet.address)}. Connected wallet
            differs. Sign in again to switch profiles.
          </p>
        ) : null}
      </div>
    </div>
  );
}
