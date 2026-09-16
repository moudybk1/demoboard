import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pixelBadge = cva(
  "inline-flex items-center gap-1.5 pixel-corners border-[3px] px-2.5 py-1.5 font-pixel text-xs font-semibold uppercase leading-none",
  {
    variants: {
      tone: {
        neutral: "border-void bg-cream text-muted",
        gold: "border-void bg-gold text-void",
        monopoly: "border-void bg-monopoly text-cream",
        ludo: "border-void bg-ludo text-cream",
        success: "border-void bg-success text-cream",
        danger: "border-void bg-danger text-cream",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function PixelBadge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof pixelBadge>) {
  return <span className={cn(pixelBadge({ tone }), className)} {...props} />;
}
