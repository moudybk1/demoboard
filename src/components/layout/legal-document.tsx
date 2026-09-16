import { PixelHeading } from "@/components/ui/pixel-label";
import { PixelPanel } from "@/components/ui/pixel-panel";

export type LegalSection = {
  heading: string;
  /** What this section must cover once a lawyer writes it. */
  covers: string;
};

/**
 * Shared shell for the Terms and Privacy pages.
 *
 * Both are drafts. The notice is deliberately loud and sits above the content:
 * a legal page that looks finished but is not is worse than no page, so the
 * reader is told before they read a word.
 */
export function LegalDocument({
  title,
  intent,
  sections,
}: {
  title: string;
  /** One line on what this document will govern. */
  intent: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto w-full max-w-[48rem] space-y-6">
      <PixelHeading as="h1" size="lg">
        {title}
      </PixelHeading>

      <PixelPanel
        role="note"
        className="border-danger/50 bg-danger/10 px-5 py-4"
      >
        <p className="font-pixel text-xs uppercase tracking-wider text-danger">
          Draft, not in force
        </p>
        <p className="mt-2 text-xs leading-relaxed text-parchment">
          This document has not been written or reviewed by a lawyer. The
          sections below list what it needs to cover; none of it binds anyone
          yet. Do not rely on it. BOARD is not accepting real deposits while
          this notice is here.
        </p>
      </PixelPanel>

      <p className="text-xs leading-relaxed text-muted">{intent}</p>

      <ol className="list-none space-y-4">
        {sections.map((section, index) => (
          <li key={section.heading}>
            <PixelPanel className="px-5 py-4">
              <p className="font-pixel text-xs uppercase tracking-wider text-gold">
                {String(index + 1).padStart(2, "0")} · {section.heading}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-faint">
                {section.covers}
              </p>
            </PixelPanel>
          </li>
        ))}
      </ol>
    </div>
  );
}
