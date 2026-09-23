"use client";

import { useMemo, useState } from "react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  MOCK_NETWORK,
  MOCK_WALLET_BALANCE,
  WITHDRAW_PRESETS,
} from "@/lib/mock/wallet";
import { cn, formatBoard } from "@/lib/utils";

type WithdrawPhase = "form" | "confirm" | "pending" | "success" | "failed";

const FAIL_DEMO = 777;

/**
 * Withdraw form with balance validation and mock pending / success / error states.
 */
export function WithdrawForm({ className }: { className?: string }) {
  const available = MOCK_WALLET_BALANCE.available;
  const [amount, setAmount] = useState(String(WITHDRAW_PRESETS[0]));
  const [phase, setPhase] = useState<WithdrawPhase>("form");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const value = Number(amount.replace(/,/g, ""));
    return Number.isFinite(value) ? value : NaN;
  }, [amount]);

  const isValid = Number.isFinite(parsed) && parsed > 0 && parsed <= available;

  function validate(): boolean {
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a withdraw amount greater than zero.");
      return false;
    }
    if (parsed > available) {
      setError(
        `Not enough available balance. You can withdraw up to ${formatBoard(available)} BOARD (locked room funds stay put).`,
      );
      return false;
    }
    setError(null);
    return true;
  }

  function reset() {
    setPhase("form");
    setError(null);
    setAmount(String(WITHDRAW_PRESETS[0]));
  }

  function submit() {
    if (!validate()) return;
    setPhase("pending");
    window.setTimeout(() => {
      setPhase(parsed === FAIL_DEMO ? "failed" : "success");
    }, 900);
  }

  if (phase === "pending") {
    return (
      <Status
        className={className}
        tone="pending"
        title="Withdraw pending"
        body={`Broadcasting ${formatBoard(parsed)} BOARD to ${MOCK_NETWORK.walletLabel} on ${MOCK_NETWORK.chain}…`}
      />
    );
  }

  if (phase === "success") {
    return (
      <Status
        className={className}
        tone="success"
        title="Withdraw confirmed"
        body="Mock transfer left the platform balance. Check your chain wallet for the receipt."
        actionLabel="Withdraw again"
        onAction={reset}
      />
    );
  }

  if (phase === "failed") {
    return (
      <Status
        className={className}
        tone="danger"
        title="Withdraw failed"
        body="The mock chain rejected this withdraw. Try again with a different amount."
        actionLabel="Try again"
        onAction={reset}
      />
    );
  }

  if (phase === "confirm" && isValid) {
    return (
      <div className={cn("space-y-5", className)}>
        <p className="font-pixel text-xs uppercase tracking-widest text-gold">
          Confirm withdraw
        </p>
        <PixelCard as="dl" size="sm" tone="ink" faceClassName="space-y-3 p-4">
          <div className="flex justify-between gap-2 text-sm">
            <dt className="font-pixel text-xs uppercase text-faint">Amount</dt>
            <dd className="font-pixel text-gold">
              {formatBoard(parsed)} BOARD
            </dd>
          </div>
          <div className="flex justify-between gap-2 text-sm">
            <dt className="font-pixel text-xs uppercase text-faint">
              Remaining available
            </dt>
            <dd className="text-parchment">
              {formatBoard(available - parsed)} BOARD
            </dd>
          </div>
          <div className="flex justify-between gap-2 text-sm">
            <dt className="font-pixel text-xs uppercase text-faint">To</dt>
            <dd className="text-parchment">{MOCK_NETWORK.walletLabel}</dd>
          </div>
        </PixelCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PixelButton
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={submit}
          >
            Confirm withdraw
          </PixelButton>
          <PixelButton
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setPhase("form")}
          >
            Edit amount
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block">
        <span className="font-pixel text-xs uppercase text-muted">
          Withdraw amount
        </span>
        <input
          inputMode="decimal"
          value={amount}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setAmount(event.target.value);
            if (error) setError(null);
          }}
          className={cn(
            "mt-2 w-full pixel-corners border-[3px] bg-cream px-3 py-3 font-pixel text-base text-parchment outline-none focus:border-gold-deep",
            error ? "border-danger" : "border-edge",
          )}
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="font-pixel text-xs leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {WITHDRAW_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(String(preset));
              setError(null);
            }}
            className="pixel-corners border border-edge px-3 py-1.5 font-pixel text-xs text-muted hover:border-gold hover:text-gold"
          >
            {formatBoard(preset)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setAmount(String(available));
            setError(null);
          }}
          className="pixel-corners border border-edge px-3 py-1.5 font-pixel text-xs text-muted hover:border-gold hover:text-gold"
        >
          Max
        </button>
        <button
          type="button"
          onClick={() => {
            setAmount(String(available + 500));
            setError(null);
          }}
          className="pixel-corners border border-danger/40 px-3 py-1.5 font-pixel text-xs text-danger/80 hover:border-danger"
        >
          Over max
        </button>
        <button
          type="button"
          onClick={() => {
            setAmount(String(FAIL_DEMO));
            setError(null);
          }}
          className="pixel-corners border border-danger/40 px-3 py-1.5 font-pixel text-xs text-danger/80 hover:border-danger"
        >
          Fail test
        </button>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Available{" "}
        <span className="inline-flex align-middle">
          <BoardAmount value={available} size="sm" tone="gold" />
        </span>
        . Locked{" "}
        <span className="inline-flex align-middle">
          <BoardAmount value={MOCK_WALLET_BALANCE.locked} size="sm" />
        </span>{" "}
        stays in active rooms. Use {FAIL_DEMO} BOARD to test a failed withdraw.
      </p>

      <PixelButton
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => {
          if (validate()) setPhase("confirm");
        }}
      >
        Review withdraw
      </PixelButton>
    </div>
  );
}

function Status({
  className,
  tone,
  title,
  body,
  actionLabel,
  onAction,
}: {
  className?: string;
  tone: "pending" | "success" | "danger";
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    tone === "pending"
      ? "text-gold border-gold/40 bg-gold/5"
      : tone === "success"
        ? "text-success border-success/40 bg-success/5"
        : "text-danger border-danger/40 bg-danger/5";

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("border-2 p-4", toneClass)}>
        <p className="font-pixel text-[10px] uppercase">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      {actionLabel && onAction ? (
        <PixelButton type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </PixelButton>
      ) : null}
    </div>
  );
}
