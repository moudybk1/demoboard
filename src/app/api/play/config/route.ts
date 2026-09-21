import { NextResponse } from "next/server";

import {
  getBoardChainId,
  getBoardChainLabel,
  ROBINHOOD_TESTNET_FAUCET,
} from "@/lib/wallet/chains";
import { PLAY_ENTRY_FEE, PLAY_STAKE_SYMBOL } from "@/lib/game/play-player";
import { getPlayConfig } from "@/server/services/play-table.service";

/** GET /api/play/config · treasury + sit fee for the play client. */
export async function GET() {
  const config = getPlayConfig();
  return NextResponse.json({
    ...config,
    symbol: PLAY_STAKE_SYMBOL,
    chainId: getBoardChainId(),
    chainLabel: getBoardChainLabel(),
    faucet: ROBINHOOD_TESTNET_FAUCET,
    entryFee: PLAY_ENTRY_FEE,
  });
}
