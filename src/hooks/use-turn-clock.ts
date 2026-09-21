"use client";

import { useEffect, useRef, useState } from "react";

import { MATCH_TURN_SECONDS } from "@/lib/game/match-clock";

/**
 * Counts down while `running`. Restarts from 15s whenever `resetKey` changes.
 * `onExpire` fires once per countdown that reaches zero.
 */
export function useTurnClock({
  running,
  resetKey,
  onExpire,
}: {
  running: boolean;
  resetKey: string;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(MATCH_TURN_SECONDS);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setLeft(MATCH_TURN_SECONDS);
    if (!running) return;

    let remaining = MATCH_TURN_SECONDS;
    const id = window.setInterval(() => {
      remaining -= 1;
      setLeft(Math.max(0, remaining));
      if (remaining > 0) return;
      window.clearInterval(id);
      onExpireRef.current();
    }, 1000);

    return () => window.clearInterval(id);
  }, [resetKey, running]);

  return left;
}
