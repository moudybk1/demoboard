import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { AudioUnlock } from "@/components/audio/audio-unlock";
import { AppBootLoader } from "@/components/layout/app-boot-loader";
import { SkyActors } from "@/components/layout/sky-actors";
import { SignInProvider } from "@/components/account/sign-in-provider";
import { WalletProviders } from "@/components/wallet/wallet-providers";
import { wagmiConfig } from "@/lib/wallet/wagmi-config";

import "./globals.css";

export const metadata: Metadata = {
  title: "BOARD | Monopoly & Ludo on Robinhood Chain",
  description:
    "Play Monopoly and Ludo with $USDG entry fees on Robinhood Chain. Connect your wallet, enter a table, and compete four players to one winner.",
};

/**
 * Typography: Pixelify Sans for titles and chrome, Outfit for body copy
 * and numerals (digits stay readable inside pixel text).
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? undefined;
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <div className="board-clouds" aria-hidden />
        <SkyActors />
        <AppBootLoader />
        <WalletProviders initialState={initialState}>
          <SignInProvider>
            <AudioUnlock />
            {children}
          </SignInProvider>
        </WalletProviders>
      </body>
    </html>
  );
}
