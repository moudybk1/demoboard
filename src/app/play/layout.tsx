import type { Metadata } from "next";

import { PlayChrome } from "@/components/play/play-chrome";

export const metadata: Metadata = {
  title: "Play | BOARD",
  description: "Enter Monopoly or Ludo. Four seats. One winner.",
};

/**
 * Dedicated play site. Full viewport game client — not the marketing chrome.
 */
export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return (
    <div className="board-atmosphere relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <PlayChrome />
      {children}
    </div>
  );
}
