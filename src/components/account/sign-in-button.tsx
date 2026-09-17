"use client";

import { useSignIn } from "@/components/account/sign-in-provider";
import { PixelButton, PixelButtonLink } from "@/components/ui/pixel-button";
import { useAuthMe } from "@/hooks/use-auth-me";
import type { VariantProps } from "class-variance-authority";
import { pixelButton } from "@/components/ui/pixel-button";

type ButtonVariants = VariantProps<typeof pixelButton>;

type SignInButtonProps = {
  children?: React.ReactNode;
  className?: string;
  size?: ButtonVariants["size"];
  variant?: ButtonVariants["variant"];
  "aria-label"?: string;
};

/** Always opens the in-page wallet picker. Never navigates away. */
export function SignInButton({
  children = "Sign in",
  className,
  size = "sm",
  variant = "primary",
  "aria-label": ariaLabel,
}: SignInButtonProps) {
  const { openSignIn } = useSignIn();

  return (
    <PixelButton
      type="button"
      size={size}
      variant={variant}
      className={className}
      aria-label={ariaLabel}
      onClick={openSignIn}
    >
      {children}
    </PixelButton>
  );
}

type AuthOrSignInProps = {
  /** Destination once the user already has a session. */
  href: string;
  signedInLabel: string;
  signedOutLabel?: string;
  className?: string;
  size?: ButtonVariants["size"];
  variant?: ButtonVariants["variant"];
};

/**
 * Signed out → wallet picker modal.
 * Signed in → navigate to `href` (e.g. /lobby).
 */
export function AuthOrSignInButton({
  href,
  signedInLabel,
  signedOutLabel = "Sign in",
  className,
  size = "md",
  variant = "primary",
}: AuthOrSignInProps) {
  const { authenticated, loading } = useAuthMe();
  const { openSignIn } = useSignIn();

  if (loading) {
    return (
      <PixelButton
        type="button"
        size={size}
        variant={variant}
        className={className}
        disabled
      >
        …
      </PixelButton>
    );
  }

  if (authenticated) {
    return (
      <PixelButtonLink
        href={href}
        size={size}
        variant={variant}
        className={className}
      >
        {signedInLabel}
      </PixelButtonLink>
    );
  }

  return (
    <PixelButton
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={openSignIn}
    >
      {signedOutLabel}
    </PixelButton>
  );
}
