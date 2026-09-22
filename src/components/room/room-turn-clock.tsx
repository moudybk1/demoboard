"use client";

import { useEffect, type ReactNode } from "react";

import { useTurnClock } from "@/hooks/use-turn-clock";
import { MATCH_TURN_SECONDS, type TurnClockInfo } from "@/lib/game/match-clock";

/**
 * Owns the 1s countdown so the board tree does not re-render every tick.
 * Only `children` (the action bar) updates while the clock runs.
 */
export function RoomTurnClock({
  running,
  resetKey,
  strikes,
  onExpire,
  onClock,
  children,
}: {
  running: boolean;
  resetKey: string;
  strikes: number;
  onExpire: () => void;
  onClock?: (clock: TurnClockInfo) => void;
  children: (secondsLeft: number | null) => ReactNode;
}) {
  const secondsLeft = useTurnClock({ running, resetKey, onExpire });

  useEffect(() => {
    onClock?.({
      seconds: running ? secondsLeft : MATCH_TURN_SECONDS,
      active: running,
      strikes,
    });
  }, [onClock, running, secondsLeft, strikes]);

  return children(running ? secondsLeft : null);
}
