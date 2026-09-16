import { cn } from "@/lib/utils";

import { PixelLabel } from "@/components/ui/pixel-label";

type PixelFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  label?: string;
  error?: string;
  hint?: string;
};

/**
 * Canonical text / number field · cream fill, chocolate border, gold focus.
 */
export function PixelField({
  className,
  label,
  error,
  hint,
  id,
  ...props
}: PixelFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block" htmlFor={fieldId}>
      {label ? <PixelLabel>{label}</PixelLabel> : null}
      <input
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        className={cn(
          "mt-2 w-full pixel-corners border-[3px] bg-cream px-3 py-3 font-pixel text-base text-parchment outline-none",
          "transition-[border-color,box-shadow] duration-100",
          "placeholder:text-faint",
          "focus:border-gold-deep focus-visible:pixel-focus",
          "disabled:cursor-not-allowed disabled:opacity-40",
          error ? "border-danger" : "border-void",
          label ? null : "mt-0",
          className,
        )}
        {...props}
      />
      {error ? (
        <span
          id={`${fieldId}-error`}
          role="alert"
          className="mt-1 block font-pixel text-xs text-danger"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={`${fieldId}-hint`}
          className="mt-1 block text-sm text-muted"
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
