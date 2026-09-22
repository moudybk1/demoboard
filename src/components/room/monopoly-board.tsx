import { PixelArt } from "@/components/game/pixel-art";
import {
  BOARD_SIZE,
  BOARD_TILES,
  COUNTRY_GROUPS,
  groupFor,
  isCorner,
  landmarkFor,
  tilePlacement,
  type BoardTile,
  type TileEdge,
} from "@/lib/game/monopoly-board";
import { landmarkLabel } from "@/lib/game/landmark-labels";
import { seatColor } from "@/lib/game/seats";
import { cn } from "@/lib/utils";

/** The group bar faces the middle of the board, as on a physical set. */
const BAR_POSITION: Record<TileEdge, string> = {
  bottom: "top-0 left-0 right-0 h-[14%] border-b-2",
  left: "top-0 right-0 bottom-0 w-[14%] border-l-2",
  top: "bottom-0 left-0 right-0 h-[14%] border-t-2",
  right: "top-0 left-0 bottom-0 w-[14%] border-r-2",
};

const CORNER_ICON: Record<string, string> = {
  go: "→",
  jail: "⛓",
  vault: "🏦",
  "go-to-jail": "🚔",
};

/** Showcase landmarks for the center panel · cities from each region. */
const CENTER_LANDMARKS = [
  BOARD_TILES.find((t) => t.landmark === "eiffel-tower"),
  BOARD_TILES.find((t) => t.landmark === "taj-mahal"),
  BOARD_TILES.find((t) => t.landmark === "statue-of-liberty"),
  BOARD_TILES.find((t) => t.landmark === "colosseum"),
  BOARD_TILES.find((t) => t.landmark === "dubai"),
  BOARD_TILES.find((t) => t.landmark === "opera-house"),
  BOARD_TILES.find((t) => t.landmark === "seoul"),
  BOARD_TILES.find((t) => t.landmark === "christ-redeemer"),
].filter(Boolean) as BoardTile[];

/**
 * The 48-tile World Tour board as a 13×13 CSS grid. City tiles show pixel
 * landmark art; group colour bars face the centre like a printed set.
 */
export function MonopolyBoard({
  className,
  owners,
  overlay,
  center,
  activeTile,
}: {
  className?: string;
  /** Tile index -> owning seat, for the ownership markers. */
  owners?: Record<number, number>;
  /** Layer spanning the whole board · pawns, dice, and effects. */
  overlay?: React.ReactNode;
  /** Extra content inside the board's middle panel. */
  center?: React.ReactNode;
  /** Highlight the tile under the active pawn. */
  activeTile?: number;
}) {
  return (
    <div
      className={cn(
        "relative grid aspect-square w-full gap-px bg-edge p-px",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
      }}
      role="img"
      aria-label="Monopoly World Tour board with city landmarks"
    >
      {BOARD_TILES.map((tile) => {
        const { row, col, edge } = tilePlacement(tile.index);
        return (
          <Tile
            key={tile.index}
            tile={tile}
            edge={edge}
            ownerSeat={owners?.[tile.index]}
            active={activeTile === tile.index}
            style={{ gridRow: row, gridColumn: col }}
          />
        );
      })}

      <BoardCenter>{center}</BoardCenter>

      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

function Tile({
  tile,
  edge,
  ownerSeat,
  active,
  style,
}: {
  tile: BoardTile;
  edge: TileEdge;
  ownerSeat?: number;
  active?: boolean;
  style: React.CSSProperties;
}) {
  const group = groupFor(tile);
  const landmark = landmarkFor(tile);
  const landmarkName = landmarkLabel(tile.landmark);
  const corner = isCorner(tile.index);
  const owner = ownerSeat ? seatColor(ownerSeat) : undefined;
  const isCountry = tile.kind === "country";

  return (
    <div
      style={{
        ...style,
        ...(group && isCountry
          ? {
              backgroundImage: `linear-gradient(to bottom, color-mix(in srgb, ${group.color} 14%, transparent), transparent 55%)`,
            }
          : undefined),
      }}
      data-tile={tile.index}
      data-country={isCountry ? tile.name : undefined}
      data-landmark={tile.landmark}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-surface px-px transition-[box-shadow,background-color] duration-150",
        corner && "bg-surface-raised",
        active && "ring-2 ring-inset ring-gold z-[1]",
      )}
      title={[
        tile.name,
        landmarkName ? `Landmark: ${landmarkName}` : null,
        group ? group.name : null,
        tile.price ? `${tile.price} BOARD` : null,
        owner ? `Owned by ${owner.label}` : null,
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {group && (
        <span
          aria-hidden
          className={cn("absolute border-void/50", BAR_POSITION[edge])}
          style={{ backgroundColor: group.color }}
        />
      )}

      {owner && (
        <>
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 border-2",
              owner.border,
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute bottom-0 right-0 size-1.5 border border-void/50",
              owner.bg,
            )}
          />
        </>
      )}

      {corner ? (
        <>
          <span
            aria-hidden
            className="text-[clamp(8px,1.6vh,16px)] leading-none"
          >
            {CORNER_ICON[tile.kind] ?? "★"}
          </span>
          <span className="mt-0.5 text-center font-pixel text-[clamp(3px,0.55vh,6px)] leading-tight text-muted">
            {tile.short}
          </span>
        </>
      ) : (
        <>
          {landmark ? (
            <PixelArt
              sprite={landmark}
              className="w-[68%] max-w-[48px] drop-shadow-[1px_1px_0_var(--color-void)]"
              label={`${tile.name} · ${landmarkName}`}
            />
          ) : (
            <span
              aria-hidden
              className="font-pixel text-[clamp(5px,0.9vh,10px)] text-faint"
            >
              {tile.short}
            </span>
          )}

          <span className="mt-px w-full truncate px-0.5 text-center font-pixel text-[clamp(3px,0.55vh,6px)] leading-tight text-parchment">
            {tile.short}
          </span>

          {tile.price !== undefined && (
            <span className="mt-px font-sans text-[clamp(6px,0.85vh,9px)] font-bold tabular-nums leading-none tracking-tight text-gold-deep">
              {tile.price}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function BoardCenter({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{ gridArea: `2 / 2 / ${BOARD_SIZE} / ${BOARD_SIZE}` }}
      className="relative flex items-center justify-center overflow-hidden bg-felt"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-gold) 0 8px, transparent 8px 16px)",
        }}
      />

      <div className="relative flex flex-col items-center gap-2 px-2">
        <span className="font-pixel text-[clamp(14px,2.4vh,28px)] font-bold text-cream">
          BOARD
        </span>
        <span className="font-pixel text-[clamp(8px,1vh,12px)] font-bold uppercase tracking-wide text-cream/80">
          World Tour
        </span>

        <div className="mt-1 hidden grid-cols-4 gap-1 sm:grid md:gap-1.5">
          {CENTER_LANDMARKS.map((tile) => {
            const sprite = landmarkFor(tile);
            if (!sprite) return null;
            return (
              <div
                key={tile.index}
                className="rounded-md border-[2px] border-void bg-cream p-0.5"
                title={`${tile.name} · ${landmarkLabel(tile.landmark)}`}
              >
                <PixelArt
                  sprite={sprite}
                  className="size-[clamp(16px,2.8vh,32px)]"
                  label={tile.name}
                />
              </div>
            );
          })}
        </div>

        <ul className="mt-1 hidden flex-wrap justify-center gap-x-2 gap-y-0.5 lg:flex">
          {Object.values(COUNTRY_GROUPS)
            .slice(0, 8)
            .map((group) => (
              <li
                key={group.id}
                className="flex items-center gap-1 font-pixel text-[clamp(3px,0.45vh,5px)] uppercase text-faint"
              >
                <span
                  aria-hidden
                  className="size-1.5 border border-void/40"
                  style={{ backgroundColor: group.color }}
                />
                {group.name.split(" ")[0]}
              </li>
            ))}
        </ul>
      </div>
      {children}
    </div>
  );
}
