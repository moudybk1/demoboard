import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

/**
 * Outer pixel frame for boards / stages · thick chocolate rim + offset shadow.
 */
export function PixelFrame({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <PixelCard
      tone="cream"
      size="lg"
      faceClassName={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </PixelCard>
  );
}
