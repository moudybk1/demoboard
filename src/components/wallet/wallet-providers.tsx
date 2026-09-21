"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, type State } from "wagmi";

import { boardRainbowTheme } from "@/lib/wallet/rainbowkit-theme";
import { getBoardChain } from "@/lib/wallet/chains";
import { wagmiConfig } from "@/lib/wallet/wagmi-config";

import "@rainbow-me/rainbowkit/styles.css";

type WalletProvidersProps = {
  children: React.ReactNode;
  initialState?: State;
};

/**
 * Client providers for chain wallet connection (wagmi + RainbowKit + react-query).
 */
export function WalletProviders({
  children,
  initialState,
}: WalletProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={boardRainbowTheme}
          initialChain={getBoardChain()}
          appInfo={{
            appName: "BOARD",
            learnMoreUrl: "/how-to",
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
