/**
 * Minimal test endpoint - just return JSON, no tRPC
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    time: Date.now(),
    method: req.method,
    url: req.url,
  });
}
