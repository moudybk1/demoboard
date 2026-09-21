import { NextResponse, type NextRequest } from "next/server";

import {
  DEMO_COOKIE_NAME,
  demoEnterSearch,
  hasDemoCookieValue,
  isProtectedPath,
} from "@/lib/demo-access";

/**
 * Wallet, account, and payout screens stay behind the access cookie.
 * Play, lobby, and game rooms are public so matches can start today.
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
