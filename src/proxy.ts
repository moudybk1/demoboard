import { NextResponse, type NextRequest } from "next/server";

import {
  DEMO_COOKIE_NAME,
  demoEnterSearch,
  hasDemoCookieValue,
  isProtectedPath,
} from "@/lib/demo-access";

/**
 * Keep playable tables behind the closed-demo cookie. The public landing,
 * guide, and legal pages stay reachable so the GitHub project website can
 * point at `/` without exposing unfinished staking.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const unlocked = hasDemoCookieValue(
    request.cookies.get(DEMO_COOKIE_NAME)?.value,
  );
  if (unlocked) return NextResponse.next();

  const next = `${pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(new URL(demoEnterSearch(next), request.url));
}

export const config = {
  matcher: [
    "/lobby",
    "/lobby/:path*",
    "/room/:path*",
    "/wallet",
    "/wallet/:path*",
    "/account",
    "/account/:path*",
    "/wins",
    "/wins/:path*",
    "/result",
    "/result/:path*",
    "/settings",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
