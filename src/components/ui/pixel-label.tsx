import { cn } from "@/lib/utils";

/**
 * Uppercase pixel label for form fields and chrome captions.
 */
export function PixelLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-pixel text-xs font-semibold uppercase leading-none text-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Pixel display heading in Pixelify Sans.
 */
export function PixelHeading({
  as: Tag = "h2",
  size = "md",
  className,
  ...props
}: React.ComponentProps<"h2"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-5xl",
  } as const;

  return (
    <Tag
      className={cn(
        "font-pixel font-bold tracking-tight text-parchment",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
