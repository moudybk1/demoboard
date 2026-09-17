"use client";

import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/account/logout-button";
import { WalletConnectPanel } from "@/components/account/wallet-connect-panel";
import { HeroStat, PageHero } from "@/components/layout/page-hero";
import { BalanceWidget } from "@/components/wallet/balance-widget";
import { NetworkStatusBanner } from "@/components/wallet/network-status-banner";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui/pixel-panel";
import { useAuthMe } from "@/hooks/use-auth-me";
import { shortenAddress } from "@/lib/wallet/chains";

/**
 * Account hub: wallet login when signed out; wallet profile when signed in.
 */
export function AccountBoard() {
  const router = useRouter();
  const { authenticated, user, wallet, loading, refresh } = useAuthMe();

  if (loading) {
    return (
      <p className="font-pixel text-[10px] uppercase text-gold">
        Checking wallet session…
      </p>
    );
  }

  if (!authenticated || !wallet) {
    return (
      <div className="space-y-8">
        <PageHero
          title="Sign in with your wallet"
          support="No email or password. Connect on Robinhood Chain, sign once, and your BOARD profile is this wallet."
          meta={
            <>
              <HeroStat label="Auth" value="Wallet only" />
              <HeroStat label="Chain" value="Robinhood" />
            </>
          }
        />
        <div data-reveal>
          <PixelCard tone="raised" faceClassName="p-5">
            <p className="font-pixel text-[10px] uppercase tracking-wide text-parchment">
              Sign in with wallet
            </p>
            <p className="mt-2 font-pixel text-xs uppercase text-faint">
              Robinhood Chain
            </p>
            <div className="mt-5">
              <WalletConnectPanel onSignedIn={() => void refresh()} />
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }

  const label = shortenAddress(wallet.address);
  const initials = wallet.address.slice(2, 4).toUpperCase();

  return (
    <div className="space-y-8">
      <PageHero
        title={label}
        support="This wallet is your BOARD account. Deposit, join rooms, and withdraw with the same address."
        meta={
          <>
            <HeroStat label="Chain" value={wallet.chain} pulse />
            <HeroStat label="Handle" value={user?.username ?? "none"} />
          </>
        }
        actions={
          <PixelButtonLink href="/lobby" variant="primary" size="md">
            Enter lobby
          </PixelButtonLink>
        }
        stage={
          <PixelCard
            size="sm"
            tone="ink"
            stroke="gold"
            faceClassName="flex items-center gap-4 p-4"
          >
            <span
              aria-hidden
              className="grid size-14 place-items-center border-2 border-gold-deep bg-gold font-pixel text-sm text-void"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="font-pixel text-xs uppercase text-gold">
                Verified wallet
              </p>
              <p className="mt-2 break-all font-mono text-[10px] text-parchment">
                {wallet.address}
              </p>
            </div>
          </PixelCard>
        }
      />

      <div data-reveal>
        <NetworkStatusBanner />
      </div>

      <div data-reveal>
        <BalanceWidget live />
      </div>

      <PixelPanel tone="raised" className="overflow-hidden" data-reveal>
        <PixelPanelHeader>
          <PixelPanelTitle>Profile</PixelPanelTitle>
          <span className="font-pixel text-xs uppercase text-faint">
            Wallet identity
          </span>
        </PixelPanelHeader>
        <div className="space-y-3 p-5 text-sm text-muted">
          <p>
            Display handle:{" "}
            <span className="text-parchment">{user?.username}</span>
          </p>
          <p>
            There is no separate email profile. Changing wallets and signing in
            again switches accounts.
          </p>
        </div>
      </PixelPanel>

      <div data-reveal>
        <PixelButtonLink
          href="/settings"
          variant="outline"
          size="md"
          className="justify-center"
        >
          Settings
        </PixelButtonLink>
      </div>

      <div data-reveal className="border-t-2 border-edge pt-6">
        <LogoutButton
          onLoggedOut={() => {
            void refresh();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
