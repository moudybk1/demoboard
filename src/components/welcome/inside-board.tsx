import { PixelArt } from "@/components/game/pixel-art";
import { PixelCard } from "@/components/ui/pixel-card";
import { pawnSprite } from "@/lib/game/pawn-sprite";
import { INSIDE_BOARD } from "@/lib/mock/welcome";
import { cn } from "@/lib/utils";

const STORY_TONE = [
  { tone: "monopoly" as const, stroke: "monopoly" as const, bar: "bg-monopoly" },
  { tone: "ludo" as const, stroke: "ludo" as const, bar: "bg-ludo" },
];

const SEAT_LABEL = ["P1", "P2", "P3", "P4"] as const;

/**
 * About BOARD on the open sky: editorial lead + color-coded story tiles + live seats.
 */
export function InsideBoard({ className }: { className?: string }) {
  return (
    <section
      id="inside-board"
      aria-labelledby="inside-board-title"
      className={cn(
        "scroll-mt-28 border-t-[3px] border-void bg-transparent py-14 sm:py-16 lg:py-20",
        className,
      )}
    >
      <div className="board-container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-14">
          <header className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-pixel text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
              {INSIDE_BOARD.eyebrow}
            </p>
            <h2
              id="inside-board-title"
              className="mt-3 max-w-[14ch] font-pixel text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-parchment"
            >
              {INSIDE_BOARD.title}
            </h2>
            <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-muted sm:text-[1.0625rem]">
              {INSIDE_BOARD.lead}
            </p>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-faint">
              {INSIDE_BOARD.maker}
            </p>
          </header>

          <div className="grid gap-4 sm:gap-5">
            {INSIDE_BOARD.stories.map((story, index) => {
              const look = STORY_TONE[index] ?? STORY_TONE[0];
              return (
                <PixelCard
                  key={story.id}
                  as="article"
                  size="lg"
                  tone={look.tone}
                  stroke={look.stroke}
                  className={cn(
                    "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1",
                    index === 1 && "lg:ml-8",
                  )}
                  faceClassName="overflow-hidden"
                >
                  <div
                    aria-hidden
                    className={cn(
                      "flex items-center justify-between px-4 py-2",
                      look.bar,
                    )}
                  >
                    <span className="font-sans text-sm font-bold tabular-nums text-cream">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-pixel text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/85">
                      {story.title}
                    </span>
                  </div>
                  <div className="px-5 py-5 sm:px-6 sm:py-6">
                    <h3 className="font-pixel text-base font-bold uppercase leading-snug tracking-wide text-parchment sm:text-lg">
                      {story.title}
                    </h3>
                    <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted sm:text-base">
                      {story.body}
                    </p>
                  </div>
                </PixelCard>
              );
            })}

            <PixelCard
              size="lg"
              tone="ink"
              stroke="void"
              faceClassName="px-5 py-5 sm:px-6 sm:py-6"
            >
              <p className="font-pixel text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                The table
              </p>
              <p className="mt-2 font-pixel text-base font-semibold uppercase leading-snug text-cream sm:text-lg">
                {INSIDE_BOARD.caption}
              </p>
              <ul className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
                {[1, 2, 3, 4].map((seat) => (
                  <li
                    key={seat}
                    className="flex flex-col items-center gap-2 border-[3px] border-void bg-cream px-1 pb-2 pt-2"
                  >
                    <div
                      className="seat-idle w-10 sm:w-12"
                      style={{ animationDelay: `${(seat - 1) * 0.12}s` }}
                    >
                      <PixelArt sprite={pawnSprite(seat)} />
                    </div>
                    <span className="font-pixel text-[10px] font-semibold uppercase tracking-wider text-parchment">
                      {SEAT_LABEL[seat - 1]}
                    </span>
                  </li>
                ))}
              </ul>
            </PixelCard>
          </div>
        </div>
      </div>
    </section>
  );
}
