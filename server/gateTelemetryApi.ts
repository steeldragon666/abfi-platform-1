/**
 * Gate Telemetry Ingest API
 * Receives MQTT-to-HTTP payloads from IoT gateways.
 */

import { Router } from "express";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { gateDevices, gateEvents, gateReleases } from "../drizzle/schema";
import { getGatePaymentRailService } from "./services/blockchain";

const router = Router();

const DEFAULT_GATE0_RELEASE_PERCENT = 30;
const MIN_TONNES = Number(process.env.GATE_MIN_TONNES ?? "0");
const GATE0_RELEASE_PERCENT = Number(
  process.env.GATE0_RELEASE_PERCENT ?? DEFAULT_GATE0_RELEASE_PERCENT.toString()
);

function getRawPayload(req: any) {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString("utf8");
  }
  return JSON.stringify(req.body ?? {});
}

function normalizeSignature(signature: string) {
  return signature.replace(/^sha256=/i, "").trim();
}

function verifyHmacSignature(payload: string, secret: string, signature: string) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const provided = normalizeSignature(signature);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function verifyEd25519Signature(payload: string, publicKey: string, signature: string) {
  try {
    const sigBuffer = Buffer.from(signature, "base64");
    return crypto.verify(null, Buffer.from(payload), publicKey, sigBuffer);
  } catch {
    return false;
  }
}

router.post("/", async (req, res) => {
  const deviceIdHeader = req.header("X-ABFI-Device-Id");
  const signatureHeader = req.header("X-ABFI-Signature");

  if (!deviceIdHeader) {
    res.status(400).json({ status: "error", message: "Missing X-ABFI-Device-Id header" });
    return;
  }

  const db = await getDb();
  if (!db) {
    res.status(500).json({ status: "error", message: "Database not available" });
    return;
  }

  const [device] = await db
    .select()
    .from(gateDevices)
    .where(eq(gateDevices.deviceId, deviceIdHeader))
    .limit(1);

  if (!device || device.status !== "active") {
    res.status(401).json({ status: "error", message: "Unauthorized device" });
    return;
  }

  const payload = req.body ?? {};
  const rawPayload = getRawPayload(req);
  const parsedGateIndex = Number(payload.gateIndex ?? payload.gate_index ?? 0);
  const gateIndex = Number.isFinite(parsedGateIndex) ? parsedGateIndex : 0;
  const consignmentIdRaw = payload.consignmentId ?? payload.consignment_id ?? null;
  const consignmentId =
    consignmentIdRaw !== null && consignmentIdRaw !== undefined
      ? String(consignmentIdRaw)
      : null;
  const deliveryIdRaw = payload.deliveryId ?? payload.delivery_id ?? null;
  const parsedDeliveryId = deliveryIdRaw !== null ? Number(deliveryIdRaw) : null;
  const deliveryId = Number.isFinite(parsedDeliveryId) ? parsedDeliveryId : null;
  const eventTime = payload.timestamp ? new Date(payload.timestamp) : null;
  const latitude = payload.latitude ?? payload.lat ?? null;
  const longitude = payload.longitude ?? payload.lng ?? null;
  const cumulativeTonnes = payload.cumulativeTonnes ?? payload.cumulative_t ?? null;
  const cumulativeDryMatterTonnes =
    payload.cumulativeDryMatterTonnes ?? payload.cumulative_dm ?? null;

  let signatureStatus: "verified" | "invalid" | "missing" = "missing";
  let verified = false;

  if (signatureHeader) {
    const algorithm = (device.keyAlgorithm ?? "hmac-sha256").toLowerCase();
    if (algorithm === "hmac-sha256" && device.sharedSecret) {
      verified = verifyHmacSignature(rawPayload, device.sharedSecret, signatureHeader);
    } else if (algorithm === "ed25519" && device.publicKey) {
      verified = verifyEd25519Signature(rawPayload, device.publicKey, signatureHeader);
    }
    signatureStatus = verified ? "verified" : "invalid";
  }

  const releasedPercent =
    gateIndex === 0 && cumulativeTonnes !== null && Number(cumulativeTonnes) >= MIN_TONNES
      ? GATE0_RELEASE_PERCENT
      : null;

  const status = verified ? "accepted" : "rejected";

  const [eventResult] = await db.insert(gateEvents).values({
    deviceId: device.id,
    gateIndex,
    consignmentId,
    deliveryId,
    payload,
    eventTime,
    latitude: latitude !== null ? String(latitude) : null,
    longitude: longitude !== null ? String(longitude) : null,
    cumulativeTonnes: cumulativeTonnes !== null ? String(cumulativeTonnes) : null,
    cumulativeDryMatterTonnes:
      cumulativeDryMatterTonnes !== null ? String(cumulativeDryMatterTonnes) : null,
    signatureStatus,
    releasedPercent: releasedPercent !== null ? String(releasedPercent) : null,
    status,
  });

  await db
    .update(gateDevices)
    .set({ lastSeen: new Date() })
    .where(eq(gateDevices.id, device.id));

  const gateEventId = Number(eventResult.insertId);

  let releaseRecordId: number | null = null;
  let releaseStatus: string | null = null;

  if (releasedPercent !== null && status === "accepted") {
    const existingRelease = deliveryId !== null
      ? await db
          .select()
          .from(gateReleases)
          .where(and(eq(gateReleases.deliveryId, deliveryId), eq(gateReleases.gateIndex, 0)))
          .limit(1)
      : [];

    if (existingRelease.length === 0) {
      const releaseAmount = Number(
        payload.releaseAmount ?? payload.amount ?? payload.totalValue ?? 0
      );
      const currency = payload.currency ?? "AUD";

      const paymentGuaranteeRaw = payload.paymentGuaranteeId ?? null;
      const parsedPaymentGuarantee =
        paymentGuaranteeRaw !== null ? Number(paymentGuaranteeRaw) : null;
      const paymentGuaranteeId = Number.isFinite(parsedPaymentGuarantee)
        ? parsedPaymentGuarantee
        : null;

      const [releaseResult] = await db.insert(gateReleases).values({
        gateEventId,
        consignmentId,
        deliveryId,
        paymentGuaranteeId,
        gateIndex: 0,
        releasePercent: String(releasedPercent),
        releaseAmount: String(releaseAmount),
        currency,
        status: "pending",
      });

      releaseRecordId = Number(releaseResult.insertId);
      releaseStatus = "pending";

      const recipient = payload.recipient ?? payload.recipientAddress ?? null;
      const gateChainService = getGatePaymentRailService();

      if (gateChainService && recipient && deliveryId !== null) {
        const chainResult = await gateChainService.releaseGate0(
          deliveryId,
          releaseAmount,
          recipient
        );

        releaseStatus = chainResult.success ? "confirmed" : "failed";

        await db
          .update(gateReleases)
          .set({
            status: releaseStatus,
            txHash: chainResult.txHash ?? null,
            chainId: chainResult.chainId ?? null,
          })
          .where(eq(gateReleases.id, releaseRecordId));
      }
    } else {
      releaseRecordId = existingRelease[0].id;
      releaseStatus = existingRelease[0].status;
    }
  }

  res.status(200).json({
    status,
    gateIndex,
    consignmentId,
    deliveryId,
    releasedPercent,
    gateEventId,
    releaseId: releaseRecordId,
    releaseStatus,
  });
});

export { router as gateTelemetryRouter };
