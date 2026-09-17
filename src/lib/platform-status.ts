/**
 * Whether staking real BOARD is wired end to end.
 *
 * The API exists, but the lobby and game screens still render from
 * `src/lib/mock`, and joining a room charges nothing. While this is false the
 * UI must say so: balances, room lists, and Join are labelled as sample data
 * rather than presented as real. Flip it when the screens call the API.
 */
export const PLAY_IS_LIVE = false;

/** Shown wherever sample figures stand in for real ones. */
export const SAMPLE_DATA_LABEL = "Sample data";

/** One sentence explaining why a screen shows sample figures. */
export const SAMPLE_DATA_NOTE =
  "Closed demo: tables, players, and balances on this page are sample data. Staking is not live, so nothing here charges or pays out.";
