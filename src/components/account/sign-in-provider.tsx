"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { WalletConnectPanel } from "@/components/account/wallet-connect-panel";
import { PixelButton } from "@/components/ui/pixel-button";
import { playSfx } from "@/lib/audio/audio-manager";
import { ROBINHOOD_CHAIN_LABEL } from "@/lib/wallet/chains";
import { cn } from "@/lib/utils";

type SignInContextValue = {
  open: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
};

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn() {
  const ctx = useContext(SignInContext);
  if (!ctx) {
    throw new Error("useSignIn must be used within SignInProvider");
  }
  return ctx;
}

/** Optional hook when the provider may be absent (e.g. tests). */
export function useSignInOptional() {
  return useContext(SignInContext);
}

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSignIn = useCallback(() => {
    playSfx("ui_click");
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ open, openSignIn, closeSignIn }),
    [open, openSignIn, closeSignIn],
  );

  return (
    <SignInContext.Provider value={value}>
      {children}
      <SignInModal open={open} onClose={closeSignIn} />
    </SignInContext.Provider>
  );
}

function SignInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close sign in"
        className="absolute inset-0 bg-void/80 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-title"
        className={cn(
          "relative z-10 w-full max-w-md pixel-corners-lg border-[4px] border-void bg-surface shadow-pixel-lg",
          "max-h-[min(88dvh,40rem)] overflow-y-auto",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b-[3px] border-void px-4 py-4 sm:px-5">
          <div>
            <p className="font-pixel text-xs font-semibold uppercase leading-none text-gold-deep">
              {ROBINHOOD_CHAIN_LABEL}
            </p>
            <h2
              id="sign-in-title"
              className="mt-2 font-pixel text-xl font-bold leading-snug text-parchment"
            >
              Sign in with wallet
            </h2>
          </div>
          <PixelButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </PixelButton>
        </div>

        <div className="p-4 sm:p-5">
          <WalletConnectPanel compact onSignedIn={onClose} />
        </div>
      </div>
    </div>
  );
}
