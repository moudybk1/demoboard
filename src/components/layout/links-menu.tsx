"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  DexscreenerLogo,
  TelegramLogo,
  XLogo,
} from "@/components/icons/brand-logos";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  COMMUNITY_LINKS,
  type CommunityLinkId,
} from "@/lib/community-links";
import { cn } from "@/lib/utils";

const LOGO = {
  x: XLogo,
  telegram: TelegramLogo,
  dexscreener: DexscreenerLogo,
} satisfies Record<CommunityLinkId, typeof XLogo>;

const LOGO_TONE = {
  x: "bg-void text-cream",
  telegram: "bg-cream text-[#229ED9]",
  dexscreener: "bg-[#0d1217] text-[#67f0b0]",
} satisfies Record<CommunityLinkId, string>;

/**
 * Navbar Community control. Desktop uses a floating menu; the mobile header
 * passes `variant="inline"` so links expand inside the hamburger panel.
 */
export function LinksMenu({
  className,
  triggerClassName,
  label = "Community",
  variant = "menu",
}: {
  className?: string;
  triggerClassName?: string;
  label?: string;
  variant?: "menu" | "inline";
}) {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function placeMenu() {
    const node = button.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = 220;
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12,
    );
    setPos({ top: rect.bottom + 8, left });
  }

  useEffect(() => {
    if (!open || variant === "inline") return;

    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReposition() {
      placeMenu();
    }

    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer);
    }, 0);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, variant]);

  return (
    <div ref={root} className={cn("relative flex flex-col", className)}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup={variant === "inline" ? "true" : "menu"}
        aria-controls={menuId}
        className={cn(
          "inline-flex shrink-0 cursor-pointer appearance-none items-center gap-1 rounded-full border-0 bg-transparent px-3 py-2 font-pixel text-xs font-semibold uppercase leading-none tracking-[0.14em] text-parchment transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-gold hover:text-void",
          open && "bg-gold text-void hover:bg-gold hover:text-void",
          triggerClassName,
        )}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next && variant === "menu") placeMenu();
            return next;
          });
        }}
      >
        {label}
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={cn(
            "size-[0.65rem] shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        >
          <path d="M0 0h10L5 6z" fill="currentColor" />
        </svg>
      </button>

      {open && variant === "inline" ? (
        <div id={menuId} className="mt-1 flex flex-col gap-0.5 pb-1 pl-2">
          <CommunityLinks onPick={() => setOpen(false)} compact />
        </div>
      ) : null}

      {open && variant === "menu" ? (
        <PixelCard
          id={menuId}
          role="menu"
          aria-label="Community links"
          size="md"
          className="fixed z-[60] w-[13.75rem]"
          faceClassName="overflow-hidden py-1"
          style={{ top: pos.top, left: pos.left }}
        >
          <CommunityLinks onPick={() => setOpen(false)} />
        </PixelCard>
      ) : null}
    </div>
  );
}

function CommunityLinks({
  onPick,
  compact = false,
}: {
  onPick: () => void;
  compact?: boolean;
}) {
  return (
    <>
      {COMMUNITY_LINKS.map((link) => {
        const Logo = LOGO[link.id];
        return (
          <a
            key={link.id}
            role="menuitem"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 text-parchment transition-colors hover:bg-gold/40",
              compact ? "rounded-full px-3 py-2.5" : "px-3 py-2.5",
            )}
            onClick={onPick}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center border-[3px] border-void p-1.5",
                LOGO_TONE[link.id],
              )}
            >
              <Logo />
            </span>
            <span className="font-pixel text-xs font-semibold uppercase tracking-wider">
              {link.label}
            </span>
          </a>
        );
      })}
    </>
  );
}
