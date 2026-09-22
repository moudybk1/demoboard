const DEFAULT_PLAY_PATH = "/play";

/**
 * Build a link into the separately deployed BOARD game client.
 *
 * Without NEXT_PUBLIC_PLAY_APP_URL we intentionally keep using the local route,
 * which provides a rollback path until the game deployment has been verified.
 */
export function playAppHref(path = DEFAULT_PLAY_PATH): string {
  const configured = process.env.NEXT_PUBLIC_PLAY_APP_URL?.trim();
  if (!configured) return path;

  try {
    const base = new URL(configured.endsWith("/") ? configured : `${configured}/`);
    if (base.protocol !== "http:" && base.protocol !== "https:") return path;
    return new URL(path.replace(/^\/+/, ""), base).toString();
  } catch {
    return path;
  }
}
