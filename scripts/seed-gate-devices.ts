#!/usr/bin/env tsx

/**
 * Gate Payment Rail seed script
 * Seeds a demo gate device for local telemetry testing.
 */

import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required to seed gate devices.");
    process.exit(1);
  }

  const db = drizzle(databaseUrl);

  const deviceId = process.env.GATE_DEVICE_ID ?? "GATE-DEV-001";
  const sharedSecret = process.env.GATE_DEVICE_SECRET ?? "local-dev-secret";
  const deviceType = (process.env.GATE_DEVICE_TYPE ?? "gateway") as
    | "gateway"
    | "probe"
    | "simulator";

  await db
    .insert(schema.gateDevices)
    .values({
      deviceId,
      deviceType,
      status: "active",
      keyAlgorithm: "hmac-sha256",
      sharedSecret,
      metadata: {
        seededAt: new Date().toISOString(),
        note: "Local development device",
      },
    })
    .onDuplicateKeyUpdate({
      set: {
        deviceType,
        status: "active",
        keyAlgorithm: "hmac-sha256",
        sharedSecret,
        metadata: {
          seededAt: new Date().toISOString(),
          note: "Local development device",
        },
      },
    });

  console.log(`Seeded gate device ${deviceId}.`);
}

main().catch((error) => {
  console.error("Failed to seed gate devices:", error);
  process.exit(1);
});
