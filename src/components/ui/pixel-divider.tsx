import { cn } from "@/lib/utils";

/**
 * Chunky rule used between panel sections.
 */
export function PixelDivider({
  className,
  label,
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  if (label) {
    return (
      <div
        className={cn("flex items-center gap-3", className)}
        role="separator"
        {...props}
      >
        <span className="h-1 flex-1 bg-void/20" />
        <span className="font-pixel text-xs font-semibold uppercase text-faint">
          {label}
        </span>
        <span className="h-1 flex-1 bg-void/20" />
      </div>
    );
  }

  return (
    <div
      className={cn("h-1 w-full bg-void/20", className)}
      role="separator"
      {...props}
    />
  );
}
