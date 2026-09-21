"use client";

import { useSignIn } from "@/components/account/sign-in-provider";

/**
 * Text-style Connect Wallet control for dense chrome like the footer.
 */
export function ConnectWalletTextLink({
  className,
  children = "Connect Wallet",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { openSignIn } = useSignIn();

  return (
    <button type="button" className={className} onClick={openSignIn}>
      {children}
    </button>
  );
}
