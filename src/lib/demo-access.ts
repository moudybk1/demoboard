/**
 * Access cookie for wallet, account, and payout screens. Play, lobby, and
 * rooms are public. Matches start without this gate.
 *
 * Edge-safe: no Node builtins. The access code itself is checked only in the
 * enter route handler.
 */

export const DEMO_COOKIE_NAME = "board_demo";
export const DEMO_COOKIE_VALUE = "ok";
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_DEMO_ACCESS_CODE = "BOARD-CLOSED";
export const DEMO_CHANGE_EVENT = "board-demo-change";

export const DEMO_ENTER_PATH = "/demo";
export const DEMO_DEFAULT_NEXT = "/play";

const PROTECTED_PREFIXES = [
  "/wallet",
  "/account",
  "/wins",
  "/result",
  "/settings",
  "/auth",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function hasDemoCookieValue(value: string | undefined | null): boolean {
  return value === DEMO_COOKIE_VALUE;
}

/**
 * Only same-origin relative paths. Rejects protocol-relative URLs, API
 * bounce loops, and the gate itself.
 */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return DEMO_DEFAULT_NEXT;

  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return DEMO_DEFAULT_NEXT;
  }
  if (path.startsWith("/api") || path === DEMO_ENTER_PATH || path.startsWith(`${DEMO_ENTER_PATH}/`)) {
    return DEMO_DEFAULT_NEXT;
  }

  return path;
}

export function demoEnterSearch(next: string): string {
  const params = new URLSearchParams();
  if (next && next !== DEMO_DEFAULT_NEXT) params.set("next", next);
  const query = params.toString();
  return query ? `${DEMO_ENTER_PATH}?${query}` : DEMO_ENTER_PATH;
}
