"use client";

import { useId, useState } from "react";
import Link from "next/link";

import { GuideActionBar } from "@/components/welcome/guide-action-bar";
import {
  FAQ_INTRO,
  FAQ_ITEMS,
  type FaqBlock,
  type FaqItem,
} from "@/lib/mock/faq";
import { cn } from "@/lib/utils";

/**
 * Accordion FAQ: one open answer at a time.
 */
export function DemoFaqContent({ className }: { className?: string }) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <div className={cn("space-y-8 sm:space-y-10", className)}>
      <header className="max-w-2xl">
        <h1 className="font-pixel text-[clamp(1.85rem,3.5vw,3rem)] font-bold leading-snug tracking-tight text-parchment">
          {FAQ_INTRO.title}
        </h1>
        <p className="mt-3 font-pixel text-sm font-semibold leading-snug text-gold-deep sm:text-base">
          {FAQ_INTRO.support}
        </p>
        <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-muted sm:text-[1.0625rem]">
          {FAQ_INTRO.lead}
        </p>
      </header>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <FaqAccordionItem
            key={item.id}
            item={item}
            open={openId === item.id}
            panelId={`${baseId}-${item.id}-panel`}
            buttonId={`${baseId}-${item.id}-button`}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/how-to" className="text-link underline hover:text-parchment">
          How to play
        </Link>
        {" · "}
        <Link href="/rules" className="text-link underline hover:text-parchment">
          Prizes and fees
        </Link>
      </p>

      <GuideActionBar
        secondaryHref="/how-to"
        secondaryLabel="How to play"
        hint="Wallet connect is almost ready. Until then, explore how to play and the prize rules."
      />
    </div>
  );
}

function FaqAccordionItem({
  item,
  open,
  panelId,
  buttonId,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  panelId: string;
  buttonId: string;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "border-[3px] border-void bg-cream shadow-pixel-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open && "bg-surface-raised",
      )}
    >
      <h2>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
          onClick={onToggle}
        >
          <span className="font-pixel text-sm font-semibold uppercase leading-snug tracking-wide text-parchment sm:text-base">
            {item.question}
          </span>
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center border-[3px] border-void bg-gold font-pixel text-sm font-bold text-void transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              open && "rotate-45",
            )}
          >
            +
          </span>
        </button>
      </h2>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "border-t-[3px] border-void px-4 pb-5 pt-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none sm:px-5 sm:pb-6",
              open ? "translate-y-0" : "-translate-y-1",
            )}
          >
            <div className="max-w-[54ch] space-y-3">
              {item.answer.map((block, index) => (
                <FaqAnswerBlock key={`${item.id}-${index}`} block={block} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqAnswerBlock({ block }: { block: FaqBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-sm leading-relaxed text-muted sm:text-base">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="font-pixel text-sm font-semibold leading-snug text-gold-deep sm:text-base">
      {block.text}
    </p>
  );
}
