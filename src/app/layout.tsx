import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { AudioUnlock } from "@/components/audio/audio-unlock";
import { AppBootLoader } from "@/components/layout/app-boot-loader";
import { SignInProvider } from "@/components/account/sign-in-provider";
import { WalletProviders } from "@/components/wallet/wallet-providers";
import { wagmiConfig } from "@/lib/wallet/wagmi-config";

import "./globals.css";

export const metadata: Metadata = {
  title: "BOARD | Play classic board games, win real tokens",
  description:
    "Monopoly and Ludo on a cartoon pixel tabletop. Four players per room, one winner, paid out in BOARD tokens on Robinhood Chain.",
};

/**
 * Typography: Pixelify Sans everywhere (loaded in globals.css).
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? undefined;
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
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
