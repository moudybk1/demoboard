import { WORK_IN_PROGRESS } from "@/lib/game-availability";

/** Place inside a relative game preview; controls must also be disabled. */
export function WorkInProgressWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-void/55">
      <span className="-rotate-6 border-y-[3px] border-gold bg-void/95 px-3 py-3 text-center font-pixel text-sm font-bold text-gold shadow-pixel sm:text-lg">
        {WORK_IN_PROGRESS}
      </span>
    </div>
  );
}
