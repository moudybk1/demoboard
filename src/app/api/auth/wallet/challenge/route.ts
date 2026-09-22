import { NextResponse } from "next/server";

import { AuthError } from "@/server/services/auth.service";
import { issueWalletLoginChallenge } from "@/server/services/wallet-auth.service";

/**
 * POST /api/auth/wallet/challenge · issue a login nonce for an address.
 *
 * Body: `{ address: string }`
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const address =
    body &&
    typeof body === "object" &&
    typeof (body as { address?: unknown }).address === "string"
      ? (body as { address: string }).address
      : null;

  if (!address) {
    return NextResponse.json({ error: "address is required." }, { status: 400 });
  }

  try {
    const challenge = await issueWalletLoginChallenge(address);
    return NextResponse.json(challenge);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[POST /api/auth/wallet/challenge]", error);
    return NextResponse.json(
      { error: "Failed to issue wallet challenge." },
      { status: 500 },
    );
  }
}
