"use client";

import { useCallback, useState } from "react";

import { ComingSoonModal } from "@/components/layout/coming-soon-modal";

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
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <ComingSoonModal open={open} onClose={onClose} />
    </>
  );
}
