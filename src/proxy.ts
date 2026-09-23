import { NextResponse, type NextRequest } from "next/server";

/** Play, wallet, and account are open. Access-code gate retired for mainnet. */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
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
