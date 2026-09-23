import Link from "next/link";

import {
  DexscreenerLogo,
  TelegramLogo,
  XLogo,
} from "@/components/icons/brand-logos";
import { ConnectWalletTextLink } from "@/components/layout/connect-wallet-text-link";
import { FooterParade } from "@/components/layout/footer-parade";
import {
  COMMUNITY_LINKS,
  type CommunityLinkId,
} from "@/lib/community-links";
import { PLAY_IS_LIVE } from "@/lib/platform-status";
import { cn } from "@/lib/utils";

const COMMUNITY_LOGO = {
  x: XLogo,
  telegram: TelegramLogo,
  dexscreener: DexscreenerLogo,
} satisfies Record<CommunityLinkId, typeof XLogo>;

/**
 * Site footer. Flat top rule with a clickable pawn-to-jail parade above it.
 */
export function SiteFooter({
  className,
  seam = false,
}: {
  className?: string;
  /** Kept for call sites. Landing and inner pages both use the flat rule. */
  seam?: boolean;
}) {
  void seam;

  return (
    <footer
      className={cn(
        "relative z-30 overflow-visible bg-ink pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div className="relative overflow-visible">
        <FooterParade />
        <div className="border-t-[3px] border-void">
          <div className="board-container relative z-[1] flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-pixel text-xs font-semibold uppercase tracking-wider text-faint">
                {PLAY_IS_LIVE
                  ? "BOARD · Robinhood Chain"
                  : "BOARD · staking coming soon"}
              </p>
              {!PLAY_IS_LIVE ? (
                <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted">
                  <Link
                    href="/#try-a-turn"
                    className="underline underline-offset-4 hover:text-parchment"
                  >
                    Try a turn
                  </Link>
                  {" · "}
                  <ConnectWalletTextLink className="underline underline-offset-4 hover:text-parchment">
                    Connect Wallet
                  </ConnectWalletTextLink>
                  {" · "}
                  <Link
                    href="/#inside-board"
                    className="underline underline-offset-4 hover:text-parchment"
                  >
                    Inside BOARD
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 sm:items-end">
              <nav
                aria-label="Community"
                className="flex flex-wrap items-center gap-3"
              >
                {COMMUNITY_LINKS.map((link) => {
                  const Logo = COMMUNITY_LOGO[link.id];
                  return (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-pixel text-xs font-semibold uppercase tracking-wider text-muted underline-offset-4 transition-colors hover:text-parchment hover:underline"
                    >
                      <span className="grid size-5 place-items-center text-current">
                        <Logo title="" />
                      </span>
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
