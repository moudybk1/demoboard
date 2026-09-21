/** Seconds a player has to roll before the turn is passed. */
export const MATCH_TURN_SECONDS = 15;

/** Missed rolls in one match before the player is kicked with no refund. */
export const MATCH_AFK_STRIKES = 3;

/** Live roll-clock snapshot the room header reads. */
export type TurnClockInfo = {
  seconds: number;
  /** True while this client must roll before the clock expires. */
  active: boolean;
  strikes: number;
};
