import { SiteHeader } from "@/components/layout/site-header";
import {
  BoardAmount,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelDivider,
  PixelField,
  PixelFrame,
  PixelHeading,
  PixelLabel,
  PixelPanel,
  PixelPanelHeader,
  PixelPanelTitle,
} from "@/components/ui";
import { boardColors } from "@/lib/design-system";

export const metadata = {
  title: "Design system | BOARD",
  description:
    "Global cartoon pixel design tokens and UI primitives for the BOARD gaming platform.",
};

const SWATCHES = [
  ["void", boardColors.void],
  ["ink", boardColors.ink],
  ["surface", boardColors.surface],
  ["raised", boardColors.surfaceRaised],
  ["edge", boardColors.edge],
  ["parchment", boardColors.parchment],
  ["gold", boardColors.gold],
  ["monopoly", boardColors.monopoly],
  ["ludo", boardColors.ludo],
  ["success", boardColors.success],
  ["danger", boardColors.danger],
] as const;

/**
 * Living catalogue of the global pixel theme · tokens, type, and primitives.
 */
export default function DesignSystemPage() {
  return (
    <div className="board-atmosphere flex min-h-full flex-col">
      <SiteHeader />
      <main className="board-container flex-1 space-y-10 py-8 sm:py-12">
        <header className="max-w-2xl space-y-3">
          <PixelLabel>Design system</PixelLabel>
          <PixelHeading as="h1" size="xl">
            Cartoon pixel table
          </PixelHeading>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Cream tiles, chocolate outlines, pixel buttons, and Pixelify
            Sans on every line. Use these primitives everywhere so BOARD
            feels like a 16 bit toy you can actually read.
          </p>
        </header>

        <section className="space-y-4">
          <PixelHeading as="h2" size="md">
            Color
          </PixelHeading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {SWATCHES.map(([name, hex]) => (
              <PixelCard
                key={name}
                size="sm"
                faceClassName="p-2"
              >
                <div
                  className="aspect-[4/3] border-2 border-edge"
                  style={{ backgroundColor: hex }}
                  data-pixel
                />
                <p className="mt-2 font-pixel text-xs uppercase text-parchment">
                  {name}
                </p>
                <p className="font-mono text-[10px] text-faint">{hex}</p>
              </PixelCard>
            ))}
          </div>
        </section>

        <PixelDivider label="type" />

        <section className="grid gap-6 md:grid-cols-2">
          <PixelPanel tone="raised">
            <PixelPanelHeader>
              <PixelPanelTitle>Display</PixelPanelTitle>
            </PixelPanelHeader>
            <div className="space-y-3 p-5">
              <PixelHeading as="h3" size="lg">
                BOARD
              </PixelHeading>
              <p className="font-pixel text-[10px] uppercase text-gold">
                Play · Deposit · Win
              </p>
              <BoardAmount value={12450.5} size="xl" tone="gold" />
            </div>
          </PixelPanel>
          <PixelPanel>
            <PixelPanelHeader>
              <PixelPanelTitle>Body</PixelPanelTitle>
            </PixelPanelHeader>
            <div className="space-y-3 p-5 text-sm leading-relaxed text-muted">
              <p>
                The whole UI runs on Pixelify Sans. Labels sit at 12px
                minimum, body at 17px, so the pixel face stays chunky
                without turning into confetti.
              </p>
              <p className="text-parchment">
                Four seats. One winner. Two percent fee · treasury and burn.
              </p>
            </div>
          </PixelPanel>
        </section>

        <PixelDivider label="primitives" />

        <section className="grid gap-6 lg:grid-cols-2">
          <PixelPanel tone="gold">
            <PixelPanelHeader>
              <PixelPanelTitle>Buttons & badges</PixelPanelTitle>
            </PixelPanelHeader>
            <div className="flex flex-wrap gap-3 p-5">
              <PixelButton size="sm">Primary</PixelButton>
              <PixelButton variant="secondary" size="sm">
                Secondary
              </PixelButton>
              <PixelButton variant="outline" size="sm">
                Outline
              </PixelButton>
              <PixelButton variant="monopoly" size="sm">
                Monopoly
              </PixelButton>
              <PixelButton variant="ludo" size="sm">
                Ludo
              </PixelButton>
              <PixelBadge tone="gold">Gold</PixelBadge>
              <PixelBadge tone="success">Paid</PixelBadge>
              <PixelBadge tone="danger">Failed</PixelBadge>
            </div>
          </PixelPanel>

          <PixelPanel tone="raised">
            <PixelPanelHeader>
              <PixelPanelTitle>Field</PixelPanelTitle>
            </PixelPanelHeader>
            <div className="space-y-4 p-5">
              <PixelField
                label="Display name"
                name="demo-username"
                placeholder="Yoga"
                defaultValue="Yoga"
              />
              <PixelField
                label="Amount"
                name="demo-amount"
                inputMode="decimal"
                placeholder="1000"
                error="Enter at least 100 BOARD."
              />
            </div>
          </PixelPanel>
        </section>

        <section>
          <PixelHeading as="h2" size="md" className="mb-4">
            Stage frame
          </PixelHeading>
          <PixelFrame className="scanlines relative aspect-[16/7] overflow-hidden">
            <div className="absolute inset-0 board-atmosphere" />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <PixelLabel>Game stage</PixelLabel>
              <PixelHeading as="p" size="lg" className="animate-float">
                Toy board lives here
              </PixelHeading>
              <p className="max-w-md text-sm text-muted">
                Use PixelFrame for Monopoly / Ludo stages. Stepped pixel
                corners, chocolate rim, offset shadow, optional confetti.
              </p>
            </div>
          </PixelFrame>
        </section>
      </main>
    </div>
  );
}
