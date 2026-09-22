import { join } from "node:path";

/**
 * Writable folder for play treasury / table snapshots.
 * Local: `.data` under the repo. Vercel: `/tmp` (ephemeral per instance).
 */
export function playDataDir() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return join("/tmp", "board-play-data");
  }
  return join(process.cwd(), ".data");
}

export function playDataPath(filename: string) {
  return join(playDataDir(), filename);
}
