/**
 * Manus AI Webhook API Route
 * Handles incoming webhooks from Manus AI
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Dynamically import to reduce bundle size
    const { handleManusWebhook } = await import("../../server/manus");
    const result = await handleManusWebhook(req.body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("[Manus Webhook] Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
