/**
 * tRPC API Route Handler
 * Catch-all handler for tRPC endpoints
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to standard Request
  const url = new URL(req.url || "/", `https://${req.headers.host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  // Read body for POST/PUT requests
  let body: string | undefined;
  if (req.method === "POST" || req.method === "PUT") {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body: body,
  });

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async ({ req }) => {
        // Extract cookies from the original Vercel request
        const cookieHeader = req.headers.get("cookie") || "";
        return createContext({
          req: { headers: { cookie: cookieHeader } } as any,
          res: {} as any,
        });
      },
    });

    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response
    res.status(response.status);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error("[tRPC] Handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
