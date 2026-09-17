"use client";

import { useSyncExternalStore } from "react";

import {
  DEMO_CHANGE_EVENT,
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_VALUE,
  hasDemoCookieValue,
} from "@/lib/demo-access";

function readUnlocked(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEMO_COOKIE_NAME}=`));
  if (!match) return false;
  return hasDemoCookieValue(match.slice(DEMO_COOKIE_NAME.length + 1));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(DEMO_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(DEMO_CHANGE_EVENT, onStoreChange);
}

function clientTrue() {
  return true;
}

function serverFalse() {
  return false;
}

function subscribeNoop() {
  return () => {};
}

export function notifyDemoAccessChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
}

/**
 * Closed-demo cookie. `ready` is false on the server snapshot so the header
 * does not flash the wrong CTA during hydration.
 */
export function useDemoAccess() {
  const unlocked = useSyncExternalStore(subscribe, readUnlocked, serverFalse);
  const ready = useSyncExternalStore(subscribeNoop, clientTrue, serverFalse);

  return {
    ready,
    unlocked,
    cookieName: DEMO_COOKIE_NAME,
    cookieValue: DEMO_COOKIE_VALUE,
  };
}
