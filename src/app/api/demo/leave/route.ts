import { NextResponse } from "next/server";

import { DEMO_COOKIE_NAME } from "@/lib/demo-access";

/** Drop the closed-demo cookie and send the visitor back to the public site. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DEMO_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
