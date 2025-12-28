/**
 * Minimal test endpoint - no external imports
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

const t = initTRPC.create({});

const testRouter = t.router({
  ping: t.procedure.query(() => ({ pong: true, time: Date.now() })),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = new URL(req.url || "/", `https://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    let body: string | undefined;
    if (req.method === "POST" || req.method === "PUT") {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(url, { method: req.method, headers, body });

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc/test",
      req: request,
      router: testRouter,
      createContext: () => ({}),
    });

    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    console.error("[Test Error]", error);
    res.status(500).json({ error: String(error) });
  }
}
