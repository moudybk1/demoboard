"use client";

import { useSignIn } from "@/components/account/sign-in-provider";
import { PixelButton, pixelButton } from "@/components/ui/pixel-button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariants = VariantProps<typeof pixelButton>;

/**
 * Opens RainbowKit's connect modal.
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
  const { openSignIn } = useSignIn();

  return (
    <PixelButton
      type="button"
      variant={variant}
      size={size}
      className={cn("justify-center", className)}
      onClick={openSignIn}
    >
      {label}
    </PixelButton>
  );
}
