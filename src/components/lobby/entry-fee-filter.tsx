"use client";

import { Wallet } from "lucide-react";

import { BoardAmount } from "@/components/ui/board-amount";
import { cn } from "@/lib/utils";

/** `null` means "no tier filter" · show every entry fee. */
export type EntryFeeFilter = number | null;

export function EntryFeeFilter({
  tiers,
  selected,
  onSelect,
  /** Room count per tier, so dead tiers can be dimmed instead of hidden. */
  counts,
  affordableOnly,
  onAffordableOnlyChange,
}: {
  tiers: readonly number[];
  selected: EntryFeeFilter;
  onSelect: (fee: EntryFeeFilter) => void;
  counts: Record<number, number>;
  affordableOnly: boolean;
  onAffordableOnlyChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-pixel text-xs font-semibold uppercase leading-none text-faint">
        Entry fee
      </span>

      <div
        role="group"
        aria-label="Filter rooms by entry fee"
        className="flex flex-wrap items-center gap-2"
      >
        <FilterChip
          active={selected === null}
          onClick={() => onSelect(null)}
          label="All"
        />

        {tiers.map((tier) => {
          const count = counts[tier] ?? 0;
          return (
            <FilterChip
              key={tier}
              active={selected === tier}
              empty={count === 0}
              onClick={() => onSelect(selected === tier ? null : tier)}
              label={
                <>
                  <BoardAmount
                    value={tier}
                    size="xs"
                    tone={selected === tier ? "gold" : "muted"}
                    showTicker={false}
                    compact
                  />
                  <span className="text-xs opacity-60">({count})</span>
                </>
              }
            />
          );
        })}
      </div>

      <label
        className={cn(
          "pixel-corners ml-1 flex cursor-pointer items-center gap-2 border-[3px] px-3 py-1.5 transition-colors",
          affordableOnly
            ? "border-void bg-gold text-void"
            : "border-void bg-surface text-muted hover:bg-gold hover:text-void",
        )}
      >
        <input
          type="checkbox"
          checked={affordableOnly}
          onChange={(event) => onAffordableOnlyChange(event.target.checked)}
          className="size-3 accent-gold"
        />
        <Wallet className="size-3" aria-hidden />
        <span className="font-pixel text-xs font-semibold uppercase leading-none">
          Within balance
        </span>
      </label>
    </div>
  );
}

function FilterChip({
  active,
  empty = false,
  label,
  onClick,
}: {
  active: boolean;
  empty?: boolean;
  label: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "pixel-corners flex items-center gap-1.5 border-[3px] px-3 py-1.5 font-pixel text-xs font-semibold uppercase leading-none",
        "transition-[background-color,border-color,transform] duration-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
        active
          ? "border-void bg-gold text-void"
          : "border-void bg-surface text-muted hover:bg-surface-hover hover:text-parchment",
        // Tiers with nothing open stay clickable but recede visually.
        empty && !active && "opacity-40",
      )}
    >
      {label}
    </button>
  );
}
