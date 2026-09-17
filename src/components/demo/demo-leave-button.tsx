"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PixelButton } from "@/components/ui/pixel-button";
import { notifyDemoAccessChange } from "@/hooks/use-demo-access";

export function DemoLeaveButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    try {
      await fetch("/api/demo/leave", { method: "POST" });
    } catch {
      // Cookie clear is best-effort; still send them home.
    }
    notifyDemoAccessChange();
    router.replace("/");
    router.refresh();
  }

  return (
    <PixelButton
      type="button"
      size="sm"
      variant="ghost"
      className={className}
      disabled={busy}
      onClick={leave}
    >
      {busy ? "Leaving…" : "Leave demo"}
    </PixelButton>
  );
}
