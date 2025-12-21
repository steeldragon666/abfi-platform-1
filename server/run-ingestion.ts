/**
 * Direct ingestion script - bypasses API authentication
 * Run with: npx tsx server/run-ingestion.ts
 */

import { runAllConnectors } from "./connectors";
import { processSignals } from "./services/entityResolution";
import { recalculateAllScores } from "./services/signalScoring";
import { getDb } from "./db";

async function runIngestion() {
  console.log("=".repeat(60));
  console.log("STEALTH DISCOVERY INGESTION");
  console.log("=".repeat(60));
  console.log();

  // Check database connection
  const db = await getDb();
  if (!db) {
    console.error("ERROR: Database not available");
    console.log("Make sure DATABASE_URL is configured in .env");
    process.exit(1);
  }
  console.log("✓ Database connected");

  // Calculate since date (30 days ago)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  console.log(`\nFetching signals since: ${since.toISOString().split("T")[0]}`);

  try {
    // Run all connectors
    console.log("\n" + "-".repeat(60));
    console.log("Running all connectors...");
    console.log("-".repeat(60));

    const results = await runAllConnectors(since);

    console.log("\nConnector Results:");
    let totalSignals = 0;
    for (const [name, result] of Object.entries(results.results)) {
      console.log(`  ${name}: ${result.signalsDiscovered} signals`);
      totalSignals += result.signalsDiscovered;
      if (result.errors.length > 0) {
        result.errors.forEach((e) => console.log(`    ERROR: ${e}`));
      }
    }
    console.log(`  TOTAL: ${totalSignals} signals`);

    // Process signals through entity resolution
    console.log("\n" + "-".repeat(60));
    console.log("Processing signals through entity resolution...");
    console.log("-".repeat(60));

    let totalEntitiesCreated = 0;
    let totalEntitiesUpdated = 0;

    for (const [connectorName, connectorResult] of Object.entries(results.results)) {
      if (connectorResult.signals.length > 0) {
        console.log(`\nProcessing ${connectorResult.signals.length} signals from ${connectorName}...`);
        const processed = await processSignals(connectorResult.signals, connectorName);
        console.log(`  Created: ${processed.entitiesCreated} entities`);
        console.log(`  Updated: ${processed.entitiesUpdated} entities`);
        totalEntitiesCreated += processed.entitiesCreated;
        totalEntitiesUpdated += processed.entitiesUpdated;
      }
    }

    // Recalculate all scores
    console.log("\n" + "-".repeat(60));
    console.log("Recalculating entity scores...");
    console.log("-".repeat(60));

    const scoreResult = await recalculateAllScores();
    console.log(`  Updated scores for ${scoreResult.updated} entities`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("INGESTION COMPLETE");
    console.log("=".repeat(60));
    console.log(`  Total signals discovered: ${totalSignals}`);
    console.log(`  Entities created: ${totalEntitiesCreated}`);
    console.log(`  Entities updated: ${totalEntitiesUpdated}`);
    console.log(`  Scores recalculated: ${scoreResult.updated}`);

  } catch (error) {
    console.error("\nIngestion failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

runIngestion().catch(console.error);
