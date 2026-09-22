import { Resolver } from "node:dns/promises";
import https from "node:https";

/**
 * Local resolvers on this network answer Robinhood Chain hosts with the wrong
 * address, so Node's fetch fails TLS and sit verification never sees a payment
 * the wallet already sent. Look those hosts up on public DNS and connect with
 * the real certificate name.
 */
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const cache = new Map<string, { ip: string; at: number }>();

function needsPublicDns(hostname: string) {
  return hostname.endsWith(".chain.robinhood.com");
}

async function resolve4(hostname: string) {
  const hit = cache.get(hostname);
  if (hit && Date.now() - hit.at < 60_000) return hit.ip;
  const [ip] = await resolver.resolve4(hostname);
  if (!ip) throw new Error(`No address for ${hostname}`);
  cache.set(hostname, { ip, at: Date.now() });
  return ip;
}

export function boardRpcFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (!needsPublicDns(url.hostname)) return fetch(input, init);

  const method =
    init?.method ??
    (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET");
  const signal =
    init?.signal ??
    (typeof input !== "string" && !(input instanceof URL) ? input.signal : undefined);

  return resolve4(url.hostname).then(
    (ip) =>
      new Promise((resolve, reject) => {
        const headers: Record<string, string> = { host: url.hostname };
        const incoming = new Headers(
          init?.headers ??
            (typeof input !== "string" && !(input instanceof URL)
              ? input.headers
              : undefined),
        );
        incoming.forEach((value, key) => {
          if (key.toLowerCase() === "host") return;
          headers[key] = value;
        });

        const req = https.request(
          {
            host: ip,
            servername: url.hostname,
            path: `${url.pathname}${url.search}`,
            method,
            headers,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: res.statusCode ?? 500,
                }),
              );
            });
          },
        );

        const fail = (error: Error) => {
          req.destroy();
          reject(error);
        };
        if (signal) {
          if (signal.aborted) {
            fail(new Error("aborted"));
            return;
          }
          signal.addEventListener("abort", () => fail(new Error("aborted")), {
            once: true,
          });
        }
        req.on("error", reject);

        const body = init?.body;
        if (typeof body === "string" || body instanceof Uint8Array) {
          req.write(body);
        }
        req.end();
      }),
  );
}
