import { cn } from "@/lib/utils";

const toneClasses = {
  default: "border-void bg-surface",
  raised: "border-void bg-surface-raised",
  gold: "border-void bg-gold/35",
  monopoly: "border-void bg-monopoly/15",
  ludo: "border-void bg-ludo/15",
} as const;

export type PanelTone = keyof typeof toneClasses;

export function PixelPanel({
  tone = "default",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: PanelTone }) {
  return (
    <div
      className={cn(
        "pixel-corners border-[3px] shadow-pixel",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
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
