/**
 * Decorative sky actors: clock-spinning sun only.
 * Pawn-to-jail parade lives in the footer so it is not doubled on the grass.
 */
export function SkyActors() {
  return (
    <div className="board-sky-actors" aria-hidden>
      <div className="board-sun">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pixel-sun.svg?v=2"
          alt=""
          width={80}
          height={80}
          draggable={false}
          className="board-sun-face"
        />
      </div>
    </div>
  );
}
