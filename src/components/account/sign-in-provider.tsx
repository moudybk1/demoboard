"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

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

/**
 * Opens RainbowKit's connect modal (or the account modal when already connected).
 * Existing Connect / Sign in buttons keep calling `openSignIn`.
 */
export function SignInProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  const openSignIn = useCallback(() => {
    if (isConnected) {
      openAccountModal?.();
      return;
    }
    openConnectModal?.();
  }, [isConnected, openAccountModal, openConnectModal]);

  const closeSignIn = useCallback(() => {
    // RainbowKit owns dismiss (overlay click / Escape).
  }, []);

  const value = useMemo(
    () => ({ open: false, openSignIn, closeSignIn }),
    [openSignIn, closeSignIn],
  );

  return (
    <SignInContext.Provider value={value}>{children}</SignInContext.Provider>
  );
}
