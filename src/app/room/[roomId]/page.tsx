import type { Metadata } from "next";

import { GameRoom } from "@/components/room/game-room";

export const metadata: Metadata = {
  title: "Game room | BOARD",
  description:
    "Four player Monopoly or Ludo. One winner takes the pot after a 2% fee.",
};

export default async function RoomPage(props: PageProps<"/room/[roomId]">) {
  const { roomId } = await props.params;
  const search = await props.searchParams;
  const matchId = typeof search.match === "string" ? search.match : undefined;
  return (
    <div className="board-atmosphere flex min-h-[100dvh] flex-col">
      <GameRoom key={roomId} roomId={roomId} requestedMatchId={matchId} />
    </div>
  );
}
