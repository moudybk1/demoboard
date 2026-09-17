import { PixelCard, type PixelCardStroke, type PixelCardTone } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const toneMap = {
  default: "surface",
  raised: "raised",
  gold: "goldWash",
  monopoly: "monopoly",
  ludo: "ludo",
} as const satisfies Record<string, PixelCardTone>;

export type PanelTone = keyof typeof toneMap;

export function PixelPanel({
  tone = "default",
  stroke,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: PanelTone; stroke?: PixelCardStroke }) {
  return (
    <PixelCard
      tone={toneMap[tone]}
      stroke={stroke}
      faceClassName={className}
      {...props}
    >
      {children}
    </PixelCard>
  );
}

export function PixelPanelHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b-[3px] border-void bg-cream/80 px-4 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PixelPanelTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-pixel text-sm font-semibold uppercase leading-none text-parchment",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}
