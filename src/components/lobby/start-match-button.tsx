"use client";

import { useRouter } from "next/navigation";

import { PixelButton } from "@/components/ui/pixel-button";
import { playPathForGame } from "@/lib/preview-game";
import type { GameType } from "@/lib/types";
import type { VariantProps } from "class-variance-authority";
import { pixelButton } from "@/components/ui/pixel-button";

type StartMatchButtonProps = {
  game: GameType;
  children: React.ReactNode;
  className?: string;
  size?: VariantProps<typeof pixelButton>["size"];
  variant?: VariantProps<typeof pixelButton>["variant"];
};

/** Returns to Play so the next match pays the ETH sit fee. */
export function StartMatchButton({
  game,
  children,
  className,
  size = "sm",
  variant,
}: StartMatchButtonProps) {
  const router = useRouter();

  return (
    <PixelButton
      type="button"
      size={size}
      variant={variant ?? (game === "monopoly" ? "monopoly" : "ludo")}
      className={className}
      onClick={() => {
        router.push(playPathForGame(game));
      }}
    >
      {children}
    </PixelButton>
  );
}
