"use client";

import { useEffect, useState } from "react";

/**
 * False during SSR and the first client paint, true after mount.
 * Use this to keep wallet-dependent UI identical across hydration.
 */
export function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
