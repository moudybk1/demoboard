"use client";

import { SignInButton } from "@/components/account/sign-in-button";
import { PixelButtonLink } from "@/components/ui/pixel-button";
import { useAuthMe } from "@/hooks/use-auth-me";

/** Lobby hero CTAs. Sign-in modal when logged out. */
export function LobbyHeroActions() {
  const { authenticated } = useAuthMe();

  return (
    <>
      {authenticated ? (
        <PixelButtonLink href="/lobby" variant="primary" size="md">
          Browse rooms
        </PixelButtonLink>
      ) : (
        <SignInButton variant="primary" size="md">
          Sign in
        </SignInButton>
      )}
      <PixelButtonLink href="/how-to" variant="ghost" size="md">
        How it works
      </PixelButtonLink>
    </>
  );
}
