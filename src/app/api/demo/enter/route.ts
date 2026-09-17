import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  DEFAULT_DEMO_ACCESS_CODE,
  DEMO_COOKIE_MAX_AGE,
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_VALUE,
  safeNextPath,
} from "@/lib/demo-access";
import { errorResponse, readJsonBody } from "@/server/lib/api-response";

/**
 * Unlock the closed demo.
 *
 * GET  `/api/demo/enter?code=&next=`. Project-link entry; sets the cookie
 *      and redirects. This is the URL you attach to the GitHub website field
 *      when you want the link itself to open the tables.
 * POST `{ code, next? }`. Form entry from `/demo`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const next = safeNextPath(url.searchParams.get("next"));

  if (!codesMatch(code, expectedCode())) {
    const fail = new URL("/demo", url.origin);
    fail.searchParams.set("error", "code");
    if (next !== "/lobby") fail.searchParams.set("next", next);
    return NextResponse.redirect(fail);
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  stampDemoCookie(response);
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const code =
      typeof body === "object" && body !== null && "code" in body
        ? String((body as { code?: unknown }).code ?? "")
        : "";
    const next = safeNextPath(
      typeof body === "object" && body !== null && "next" in body
        ? (body as { next?: unknown }).next
        : undefined,
    );

    if (!codesMatch(code, expectedCode())) {
      return NextResponse.json(
        { ok: false, error: "Wrong access code." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true, next });
    stampDemoCookie(response);
    return response;
  } catch (error) {
    return errorResponse(error, "POST /api/demo/enter");
  }
}

function expectedCode(): string {
  return process.env.DEMO_ACCESS_CODE?.trim() || DEFAULT_DEMO_ACCESS_CODE;
}

function codesMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided.trim());
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function stampDemoCookie(response: NextResponse) {
  response.cookies.set({
    name: DEMO_COOKIE_NAME,
    value: DEMO_COOKIE_VALUE,
    path: "/",
    maxAge: DEMO_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
