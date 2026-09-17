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
  title: "BOARD | Closed demo · cartoon pixel Monopoly & Ludo",
  description:
    "Closed demo of Monopoly and Ludo on a cartoon pixel tabletop. Staking on Robinhood Chain is not live yet. Enter with an access code to try the tables.",
};

/**
 * Typography: Pixelify Sans for titles and chrome, Outfit for body copy
 * (loaded in globals.css).
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
