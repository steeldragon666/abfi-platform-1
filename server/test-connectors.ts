/**
 * Test script to run all Stealth Discovery connectors
 * Run with: npx tsx server/test-connectors.ts
 */

import { runAllConnectors, runConnector, CONNECTOR_CONFIGS } from "./connectors";

async function testConnectors() {
  console.log("=".repeat(60));
  console.log("STEALTH DISCOVERY CONNECTOR TEST");
  console.log("=".repeat(60));
  console.log();

  // Test each connector individually
  const connectorNames = Object.keys(CONNECTOR_CONFIGS);

  for (const name of connectorNames) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Testing: ${name.toUpperCase()}`);
    console.log("─".repeat(60));

    try {
      const result = await runConnector(name);

      console.log(`✓ Success: ${result.success}`);
      console.log(`  Signals discovered: ${result.signalsDiscovered}`);
      console.log(`  Duration: ${result.duration}ms`);

      if (result.errors.length > 0) {
        console.log(`  Errors:`);
        result.errors.forEach(err => console.log(`    - ${err}`));
      }

      if (result.signals.length > 0) {
        console.log(`  Sample signals:`);
        result.signals.slice(0, 3).forEach((signal, i) => {
          console.log(`    ${i + 1}. ${signal.title}`);
          console.log(`       Entity: ${signal.entityName}`);
          console.log(`       Type: ${signal.signalType}`);
          console.log(`       Weight: ${signal.signalWeight}`);
        });
      }
    } catch (error) {
      console.log(`✗ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("RUNNING ALL CONNECTORS TOGETHER");
  console.log("=".repeat(60));

  try {
    const allResults = await runAllConnectors();

    let successCount = 0;

    for (const [name, result] of Object.entries(allResults.results)) {
      if (result.success) successCount++;
    }

    console.log(`\nSummary:`);
    console.log(`  Total connectors: ${Object.keys(allResults.results).length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Total signals discovered: ${allResults.totalSignals}`);
  } catch (error) {
    console.log(`Failed to run all connectors: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

testConnectors().catch(console.error);
