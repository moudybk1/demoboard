"use client";

import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { playSfx, unlockAudio } from "@/lib/audio/audio-manager";
import { cn } from "@/lib/utils";

const pixelButton = cva(
  // Pixel key: chocolate outline, 4px offset shadow, presses into the grid.
  [
    "pixel-corners inline-flex select-none items-center justify-center gap-2 border-[3px]",
    "font-pixel font-semibold uppercase",
    "transition-[transform,box-shadow,background-color] duration-100",
    "hover:-translate-y-px",
    "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
    "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "border-void bg-gold text-void shadow-pixel hover:bg-[#ffe566]",
        secondary:
          "border-void bg-surface-raised text-parchment shadow-pixel hover:bg-surface-hover",
        outline:
          "border-void bg-cream text-parchment shadow-pixel-sm hover:bg-surface-hover",
        monopoly:
          "border-void bg-monopoly text-cream shadow-pixel hover:brightness-110",
        ludo: "border-void bg-ludo text-cream shadow-pixel hover:brightness-110",
        ghost:
          "border-transparent bg-transparent text-muted shadow-none hover:text-parchment active:translate-y-0",
      },
      size: {
        sm: "px-3.5 py-2 text-xs leading-none",
        md: "px-5 py-2.5 text-sm leading-none",
        lg: "px-6 py-3.5 text-base leading-tight",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type PixelButtonVariants = VariantProps<typeof pixelButton>;

export function PixelButton({
  className,
  variant,
  size,
  onClick,
  sfx = true,
  ...props
}: React.ComponentProps<"button"> & PixelButtonVariants & { sfx?: boolean }) {
  return (
    <button
      {...props}
      data-click-sfx=""
      className={cn(pixelButton({ variant, size }), className)}
      onClick={(event) => {
        if (!props.disabled && sfx) {
          void unlockAudio();
          playSfx("ui_click");
        }
        onClick?.(event);
      }}
    />
  );
}

export function PixelButtonLink({
  className,
  variant,
  size,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & PixelButtonVariants) {
  return (
    <Link
      {...props}
      data-click-sfx=""
      className={cn(pixelButton({ variant, size }), className)}
      onClick={(event) => {
        void unlockAudio();
        playSfx("ui_click");
        onClick?.(event);
      }}
    />
  );
}

export { pixelButton };
