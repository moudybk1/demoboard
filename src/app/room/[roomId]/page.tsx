import type { Metadata } from "next";

import { LudoRoom } from "@/components/room/ludo-room";
import { MonopolyRoom } from "@/components/room/monopoly-room";
import { RoomHeader } from "@/components/room/room-header";
import { SampleDataNotice } from "@/components/layout/sample-data-notice";
import { getLudoRoom, ludoPrizePool } from "@/lib/mock/ludo";
import { getMonopolyRoom, monopolyPrizePool } from "@/lib/mock/monopoly";
import { MOCK_BALANCE } from "@/lib/mock/lobby";

export const metadata: Metadata = {
  title: "Game room | BOARD",
  description:
    "Four player Monopoly or Ludo. One winner takes the pot after a 2% fee.",
};

export default async function RoomPage(props: PageProps<"/room/[roomId]">) {
  const { roomId } = await props.params;
  const isLudo = roomId.toUpperCase().startsWith("LUD");
  const balance = MOCK_BALANCE.available;

  if (isLudo) {
    const state = getLudoRoom(roomId);
    return (
      <>
        <RoomHeader
          roomId={state.roomId}
          turn={state.turn}
          turnSecondsLeft={state.turnSecondsLeft}
          pot={ludoPrizePool(state)}
          entryFee={state.entryFee}
          seats={state.maxPlayers}
          balance={balance}
        />
        <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-3 sm:px-6 sm:py-5">
          <SampleDataNotice className="mb-4" />
          <LudoRoom initialState={state} />
        </main>
      </>
    );
  }

  const state = getMonopolyRoom(roomId);
  return (
    <>
      <RoomHeader
        roomId={state.roomId}
        turn={state.turn}
        turnSecondsLeft={state.turnSecondsLeft}
        pot={monopolyPrizePool(state)}
        entryFee={state.entryFee}
        seats={state.maxPlayers}
        balance={balance}
      />
      <main className="mx-auto w-full max-w-[1920px] flex-1 px-2 py-2 sm:px-4 sm:py-3">
        <SampleDataNotice className="mb-4" />
        <MonopolyRoom initialState={state} />
      </main>
    </>
  );
}
