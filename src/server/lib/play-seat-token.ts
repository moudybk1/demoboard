import { createHmac } from "node:crypto";

/**
 * Same sit payment must reopen the same seat on every serverless instance.
 * The token is derived from the tx hash, so a cold instance can recognize
 * the browser that paid without a shared database. The secret never goes
 * to the client.
 */
function seatSecret() {
  return (
    process.env.PLAY_SEAT_SECRET?.trim() ||
    process.env.PLAY_TREASURY_PRIVATE_KEY?.trim() ||
    "board-play-seat-v1"
  );
}

export function paidLeaveToken(txHash: string) {
  return createHmac("sha256", seatSecret())
    .update(txHash.toLowerCase())
    .digest("hex");
}
