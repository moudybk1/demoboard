"use client";

import { useSignMessage } from "wagmi";
import { fetchJson } from "@/lib/fetch-json";

/** Use the existing wallet challenge/session API before any paid table mutation. */
export function usePlaySession() {
  const { signMessageAsync } = useSignMessage();
  return async (address: `0x${string}`) => {
    const session = await fetch("/api/auth/me", { cache: "no-store" });
    if (session.ok) {
      const me = (await session.json()) as { wallet?: { address: string } };
      if (me.wallet?.address.toLowerCase() === address.toLowerCase()) return;
    }
    const challenge = await fetchJson<{ message: string }>(
      "/api/auth/wallet/challenge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      },
    );
    const signature = await signMessageAsync({
      account: address,
      message: challenge.message,
    });
    await fetchJson("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature, message: challenge.message }),
    });
  };
}
