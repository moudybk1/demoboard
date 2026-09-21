import type { PlayTableView } from "@/lib/game/play-table";

export type PlayStreamPayload =
  | { type: "table"; table: PlayTableView }
  | { type: "heartbeat"; tableId: string; ts: number };

type Listener = (payload: PlayStreamPayload) => void;

const rooms = new Map<string, Set<Listener>>();

function key(tableId: string) {
  return tableId.toUpperCase();
}

export function subscribePlayTable(tableId: string, listener: Listener) {
  const id = key(tableId);
  let set = rooms.get(id);
  if (!set) {
    set = new Set();
    rooms.set(id, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) rooms.delete(id);
  };
}

export function publishPlayTable(payload: PlayStreamPayload) {
  const tableId = payload.type === "table" ? payload.table.id : payload.tableId;
  const set = rooms.get(key(tableId));
  if (!set) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch (error) {
      console.error("[play-hub] listener error", error);
    }
  }
}
