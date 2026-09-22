/**
 * Small JSON fetch wrapper for browser callers.
 *
 * The API answers errors as `{ error: string }`, so a failed request throws an
 * Error carrying that message and components can show it directly instead of
 * each one re-deriving it from the status code.
 */

/** Pull the server's `error` string out of a parsed body, if there is one. */
function readErrorMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { error } = body as Record<string, unknown>;
  return typeof error === "string" && error ? error : null;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * GET/POST JSON and return the parsed body, throwing `HttpError` on a non-2xx.
 *
 * The response shape is the caller's declared type: this is the untyped
 * network boundary, so callers should only read fields the API documents.
 */
/** Parse a body that may be empty or truncated without throwing. */
export async function readResponseJson(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { credentials: "include", ...init });
  const body = await readResponseJson(response);

  if (!response.ok) {
    throw new HttpError(
      readErrorMessage(body) ?? `Request failed (${response.status})`,
      response.status,
    );
  }

  if (body === null) {
    throw new HttpError(
      `Empty response (${response.status}).`,
      response.status,
    );
  }

  return body as T;
}
