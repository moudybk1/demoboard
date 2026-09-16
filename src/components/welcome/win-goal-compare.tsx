import { WIN_GOAL_INTRO, WIN_GOALS, type WinGoalCard } from "@/lib/mock/win-goals";
import { cn } from "@/lib/utils";

export function WinGoalCompare({ className }: { className?: string }) {
  return (
    <section aria-labelledby="win-goal-title" className={cn(className)}>
      <header className="mb-8 max-w-2xl">
        <h2
          id="win-goal-title"
          className="font-pixel text-sm font-bold text-parchment text-shadow-pixel sm:text-base"
        >
          {WIN_GOAL_INTRO.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {WIN_GOAL_INTRO.support}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {WIN_GOALS.map((game) => (
          <WinGoalPanel key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

function WinGoalPanel({ game }: { game: WinGoalCard }) {
  const isMonopoly = game.accent === "monopoly";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden border-2 bg-surface/50 shadow-pixel transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-pixel-lg",
        isMonopoly ? "border-monopoly/55" : "border-ludo/55",
      )}
    >
      <div
        aria-hidden
        className={cn("h-1.5 w-full", isMonopoly ? "bg-monopoly" : "bg-ludo")}
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={cn(
              "font-pixel text-xs sm:text-sm",
              isMonopoly ? "text-monopoly" : "text-ludo",
            )}
          >
            {game.name}
          </h3>
          <span
            className={cn(
              "border-2 px-2 py-1 font-pixel text-xs uppercase tracking-wide text-parchment",
              isMonopoly
                ? "border-monopoly/40 bg-monopoly/15"
                : "border-ludo/40 bg-ludo/15",
            )}
          >
            {game.tagline}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">{game.winGoal}</p>

        <p className="mt-6 font-pixel text-xs uppercase tracking-[0.18em] text-faint">
          Path to the crown
        </p>
        <ul className="mt-3 space-y-2.5">
          {game.howYouGetThere.map((line, index) => (
            <li
              key={line}
              className="flex gap-3 text-sm leading-relaxed text-parchment/90"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center border font-pixel text-xs",
                  isMonopoly
                    ? "border-monopoly/50 text-monopoly"
                    : "border-ludo/50 text-ludo",
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
