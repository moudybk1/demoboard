import { cn } from "@/lib/utils";

const toneClasses = {
  surface: "bg-surface",
  raised: "bg-surface-raised",
  cream: "bg-cream",
  gold: "bg-gold",
  goldWash:
    "bg-[color-mix(in_srgb,var(--color-gold)_38%,var(--color-surface))]",
  monopoly:
    "bg-[color-mix(in_srgb,var(--color-monopoly)_22%,var(--color-surface))]",
  ludo: "bg-[color-mix(in_srgb,var(--color-ludo)_22%,var(--color-surface))]",
  ink: "bg-[color-mix(in_srgb,var(--color-void)_82%,var(--color-cream))]",
  felt: "felt-face",
} as const;

const strokeClasses = {
  void: "bg-void",
  danger: "bg-danger",
  gold: "bg-gold-deep",
  monopoly: "bg-monopoly",
  ludo: "bg-ludo",
} as const;

const sizeShell = {
  sm: "pixel-notch-sm p-[3px]",
  md: "pixel-notch p-[3px]",
  lg: "pixel-notch p-[4px]",
} as const;

const sizeFace = {
  sm: "pixel-notch-sm",
  md: "pixel-notch",
  lg: "pixel-notch",
} as const;

const sizeShadow = {
  sm: "pixel-card-shadow-sm",
  md: "pixel-card-shadow",
  lg: "pixel-card-shadow-lg",
} as const;

export type PixelCardTone = keyof typeof toneClasses;
export type PixelCardStroke = keyof typeof strokeClasses;
export type PixelCardSize = keyof typeof sizeShell;

type PixelCardProps<T extends React.ElementType = "div"> = {
  as?: T;
  tone?: PixelCardTone;
  stroke?: PixelCardStroke;
  size?: PixelCardSize;
  faceClassName?: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithRef<T>, "as" | "children" | "className">;

/**
 * Stepped 8-bit card: chocolate shell + clipped face + offset drop-shadow.
 * Use `className` for layout/transforms; `faceClassName` for padding/overflow.
 */
export function PixelCard<T extends React.ElementType = "div">({
  as,
  tone = "surface",
  stroke = "void",
  size = "md",
  className,
  faceClassName,
  children,
  ...props
}: PixelCardProps<T>) {
  const Comp = as ?? "div";

  return (
    <Comp className={cn(sizeShadow[size], className)} {...props}>
      <div className={cn("h-full", sizeShell[size], strokeClasses[stroke])}>
        <div
          className={cn(
            "h-full min-h-full",
            sizeFace[size],
            toneClasses[tone],
            faceClassName,
          )}
        >
          {children}
        </div>
      </div>
    </Comp>
  );
}
