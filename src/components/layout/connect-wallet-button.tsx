"use client";

import { useCallback, useState } from "react";

import { ComingSoonModal } from "@/components/layout/coming-soon-modal";
import { PixelButton, pixelButton } from "@/components/ui/pixel-button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariants = VariantProps<typeof pixelButton>;

/**
 * Primary wallet CTA. Opens a polished coming-soon dialog until connect is live.
 */
export function ConnectWalletButton({
  className,
  label = "Connect Wallet",
  variant = "primary",
  size = "lg",
}: {
  className?: string;
  label?: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
}) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <PixelButton
        type="button"
        variant={variant}
        size={size}
        className={cn("justify-center", className)}
        onClick={() => setOpen(true)}
      >
        {label}
      </PixelButton>
      <ComingSoonModal open={open} onClose={onClose} />
    </>
  );
}
