"use client";

import { useMemo, useState } from "react";

import { BoardAmount } from "@/components/ui/board-amount";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { playSfx } from "@/lib/audio/audio-manager";
import {
  DEPOSIT_PRESETS,
  DEPOSIT_STATUS_COPY,
  MOCK_DEPOSIT_FAIL_AMOUNT,
  MOCK_NETWORK,
  MOCK_WALLET_BALANCE,
} from "@/lib/mock/wallet";
import { cn, formatBoard } from "@/lib/utils";

type DepositPhase = "form" | "confirm" | "pending" | "success" | "failed";

/**
 * Deposit form with confirmation summary plus mock pending / success / error
 * status messages.
 */
export function DepositForm({ className }: { className?: string }) {
  const [amount, setAmount] = useState(String(DEPOSIT_PRESETS[1]));
  const [phase, setPhase] = useState<DepositPhase>("form");
  const [formError, setFormError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const value = Number(amount.replace(/,/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [amount]);

  const nextAvailable =
    parsed === null ? null : MOCK_WALLET_BALANCE.available + parsed;

  function resetForm() {
    setPhase("form");
    setFormError(null);
    setAmount(String(DEPOSIT_PRESETS[1]));
  }

  function goConfirm() {
    if (parsed === null) {
      setFormError(DEPOSIT_STATUS_COPY.invalid);
      return;
    }
    setFormError(null);
    setPhase("confirm");
  }

  function submitDeposit() {
    if (parsed === null) return;
    setPhase("pending");
    window.setTimeout(() => {
      const failed = parsed === MOCK_DEPOSIT_FAIL_AMOUNT;
      setPhase(failed ? "failed" : "success");
      playSfx(failed ? "error" : "deposit");
    }, 900);
  }

  if (phase === "pending" && parsed !== null) {
    return (
      <StatusBlock
        className={className}
        tone="pending"
        title="Deposit pending"
        body={`${DEPOSIT_STATUS_COPY.pending} Amount: ${formatBoard(parsed)} BOARD.`}
      />
    );
  }

  if (phase === "success" && parsed !== null) {
    return (
      <StatusBlock
        className={className}
        tone="success"
        title="Deposit confirmed"
        body={DEPOSIT_STATUS_COPY.success}
        actionLabel="Deposit again"
        onAction={resetForm}
      />
    );
  }

  if (phase === "failed") {
    return (
      <StatusBlock
        className={className}
        tone="danger"
        title="Deposit failed"
        body={DEPOSIT_STATUS_COPY.failed}
        actionLabel="Try again"
        onAction={resetForm}
      />
    );
  }

  if (phase === "confirm" && parsed !== null) {
    return (
      <div className={cn("space-y-5", className)}>
        <div>
          <p className="font-pixel text-xs uppercase tracking-widest text-gold">
            Confirm deposit
          </p>
          <p className="mt-2 text-sm text-muted">
            Review the summary, then confirm to start the mock transfer.
          </p>
        </div>

        <PixelCard as="dl" size="sm" tone="ink" faceClassName="space-y-3 p-4">
          <SummaryRow label="From wallet" value={MOCK_NETWORK.walletLabel} />
          <SummaryRow label="Network" value={MOCK_NETWORK.chain} />
          <SummaryRow
            label="Amount"
            value={`${formatBoard(parsed)} BOARD`}
            emphasize
          />
          <SummaryRow
            label="Available after"
            value={`${formatBoard(nextAvailable ?? 0)} BOARD`}
          />
        </PixelCard>

        <div className="flex flex-col gap-3 sm:flex-row">
          <PixelButton
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={submitDeposit}
          >
            Confirm deposit
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
          Deposit amount
        </span>
        <input
          inputMode="decimal"
          value={amount}
          aria-invalid={Boolean(formError)}
          onChange={(event) => {
            setAmount(event.target.value);
            if (formError) setFormError(null);
          }}
          className={cn(
            "mt-2 w-full pixel-corners border-[3px] bg-cream px-3 py-3 font-pixel text-base text-parchment outline-none focus:border-gold-deep",
            formError ? "border-danger" : "border-edge",
          )}
        />
      </label>

      {formError ? (
        <p role="alert" className="font-pixel text-xs text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {DEPOSIT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(String(preset));
              setFormError(null);
            }}
            className="pixel-corners border border-edge px-3 py-1.5 font-pixel text-xs text-muted hover:border-gold hover:text-gold"
          >
            {formatBoard(preset)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setAmount(String(MOCK_DEPOSIT_FAIL_AMOUNT));
            setFormError(null);
          }}
          className="pixel-corners border border-danger/50 px-3 py-1.5 font-pixel text-xs text-danger/80 hover:border-danger hover:text-danger"
        >
          Fail demo
        </button>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Tokens leave your chain wallet and credit available balance. Current
        available:{" "}
        <span className="inline-flex align-middle">
          <BoardAmount
            value={MOCK_WALLET_BALANCE.available}
            size="sm"
            tone="gold"
          />
        </span>
      </p>
      <p className="text-xs text-faint">{DEPOSIT_STATUS_COPY.failDemo}</p>

      <PixelButton
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        onClick={goConfirm}
      >
        Review deposit
      </PixelButton>
    </div>
  );
}

function StatusBlock({
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

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="font-pixel text-xs uppercase text-faint">{label}</dt>
      <dd
        className={cn(
          "text-sm",
          emphasize ? "font-pixel text-gold" : "text-parchment",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
