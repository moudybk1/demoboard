/**
 * Whether staking real BOARD is wired end to end.
 *
 * The API exists, but the lobby and game screens still render from
 * `src/lib/mock`, and joining a room charges nothing. While this is false the
 * UI must say so: balances, room lists, and Join are labelled as demo data
 * rather than presented as real. Flip it when the screens call the API.
 */
export const PLAY_IS_LIVE = false;

/** Shown wherever demo figures stand in for real ones. */
export const DEMO_DATA_LABEL = "Demo data";

/** One sentence explaining why a screen shows demo figures. */
export const DEMO_DATA_NOTE =
  "Closed demo: tables, players, and balances on this page are demo data. Staking is not live, so nothing here charges or pays out.";
