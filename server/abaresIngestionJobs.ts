/**
 * ABARES Data Ingestion Jobs
 * Automated scheduled tasks for fetching and storing agricultural intelligence data
 */

import { getDb } from "./db";
import { logger } from "./utils/logger";
import {
  abaresCropForecasts,
  abaresCommodityPrices,
  abaresFarmBenchmarks,
  abaresIngestionRuns,
  abaresYieldPredictions,
  abaresSupplyForecasts,
} from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { ABARESConnector, CONNECTOR_CONFIGS } from "./connectors";
import type {
  CropForecast,
  CommodityPrice,
  FarmBenchmark,
  LandUseData,
} from "./connectors/abaresConnector";

// Australian states for iteration
const AUSTRALIAN_STATES = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
] as const;
type AustralianState = (typeof AUSTRALIAN_STATES)[number];

// Bioenergy crops we track
const BIOENERGY_CROPS = [
  "wheat",
  "barley",
  "canola",
  "sorghum",
  "sugarcane",
  "cotton",
  "oats",
  "triticale",
] as const;
type BioenergyCrop = (typeof BIOENERGY_CROPS)[number];

// Commodities for price tracking
const TRACKED_COMMODITIES = [
  "wheat",
  "barley",
  "canola",
  "sorghum",
  "sugarcane",
  "cotton",
  "oats",
  "beef",
  "wool",
] as const;

/**
 * Daily ABARES Data Ingestion Job
 * Fetches latest crop forecasts and commodity prices from ABARES/data.gov.au
 * Runs every day at 5:00 AM (before covenant checks)
 */
export async function dailyAbaresIngestion(): Promise<{
  cropForecasts: number;
  commodityPrices: number;
  signalsDiscovered: number;
  errors: string[];
}> {
  logger.info("ABARES", "Starting daily ABARES data ingestion...");

  const startTime = Date.now();
  const errors: string[] = [];
  let cropForecasts = 0;
  let commodityPrices = 0;
  let signalsDiscovered = 0;

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create connector instance
    const connector = new ABARESConnector(CONNECTOR_CONFIGS.abares);

    // Record ingestion run start
    const [ingestionRun] = await db
      .insert(abaresIngestionRuns)
      .values({
        runType: "crop_report",
        sourceUrl: "https://data.gov.au/abares",
        startedAt: new Date(),
        status: "started",
      })
      .$returningId();

    // Fetch signals from ABARES connector
    const since = new Date();
    since.setDate(since.getDate() - 7); // Last 7 days of data

    try {
      const result = await connector.fetchSignals(since);
      signalsDiscovered = result.signalsDiscovered;

      if (!result.success) {
        errors.push(...result.errors);
      }

      // Process raw signals into structured data
      for (const signal of result.signals) {
        try {
          if (signal.category === "crop_forecast") {
            await processCropForecastSignal(db, signal);
            cropForecasts++;
          } else if (signal.category === "commodity_price") {
            await processCommodityPriceSignal(db, signal);
            commodityPrices++;
          }
        } catch (err) {
          errors.push(
            `Failed to process signal ${signal.id}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }
    } catch (err) {
      errors.push(
        `Connector fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    // Fetch comprehensive intelligence data
    try {
      const intelligence = await connector.getIntelligence();

      // Store crop forecasts
      for (const forecast of intelligence.cropForecasts) {
        try {
          await upsertCropForecast(db, forecast);
          cropForecasts++;
        } catch (err) {
          errors.push(
            `Failed to store forecast for ${forecast.crop}/${forecast.state}: ${err instanceof Error ? err.message : "Unknown"}`
          );
        }
      }

      // Store commodity prices
      for (const price of intelligence.commodityPrices) {
        try {
          await upsertCommodityPrice(db, price);
          commodityPrices++;
        } catch (err) {
          errors.push(
            `Failed to store price for ${price.commodity}: ${err instanceof Error ? err.message : "Unknown"}`
          );
        }
      }

      // Store farm benchmarks
      for (const benchmark of intelligence.farmBenchmarks) {
        try {
          await upsertFarmBenchmark(db, benchmark);
        } catch (err) {
          errors.push(
            `Failed to store benchmark for ${benchmark.farmType}/${benchmark.state}: ${err instanceof Error ? err.message : "Unknown"}`
          );
        }
      }
    } catch (err) {
      errors.push(
        `Intelligence fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    // Update ingestion run record
    const endTime = Date.now();
    await db
      .update(abaresIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: signalsDiscovered,
        recordsOut: cropForecasts + commodityPrices,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(abaresIngestionRuns.id, ingestionRun.id));

    console.log(
      `[AbaresIngestion] Daily ingestion complete in ${endTime - startTime}ms: ` +
        `${cropForecasts} forecasts, ${commodityPrices} prices, ${errors.length} errors`
    );

    return { cropForecasts, commodityPrices, signalsDiscovered, errors };
  } catch (error) {
    logger.error("ABARES", "Critical error in daily ingestion:", error);
    throw error;
  }
}

/**
 * Weekly Yield Prediction Generation Job
 * Generates AI-enhanced yield predictions for all state/crop combinations
 * Runs every Sunday at 3:00 AM
 */
export async function weeklyYieldPredictions(): Promise<{
  predictionsGenerated: number;
  statesProcessed: number;
  cropsProcessed: number;
  errors: string[];
}> {
  logger.info("ABARES", "Starting weekly yield prediction generation...");

  const startTime = Date.now();
  const errors: string[] = [];
  let predictionsGenerated = 0;
  const statesProcessed = new Set<string>();
  const cropsProcessed = new Set<string>();

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const connector = new ABARESConnector(CONNECTOR_CONFIGS.abares);

    // Get current season
    const now = new Date();
    const currentYear = now.getFullYear();
    const season =
      now.getMonth() >= 3
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;

    // Generate predictions for each state/crop combination
    for (const state of AUSTRALIAN_STATES) {
      for (const crop of BIOENERGY_CROPS) {
        try {
          const prediction = await connector.predictYield(state, crop, season);

          // Store prediction in database
          await db.insert(abaresYieldPredictions).values({
            crop,
            state,
            season,
            predictedYield: prediction.predictedYield,
            confidenceLow: prediction.confidenceInterval[0],
            confidenceHigh: prediction.confidenceInterval[1],
            methodology: prediction.methodology,
            basisDataPoints: prediction.basisData.length,
            generatedAt: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 1 week
          });

          predictionsGenerated++;
          statesProcessed.add(state);
          cropsProcessed.add(crop);
        } catch (err) {
          errors.push(
            `Failed prediction for ${state}/${crop}: ${err instanceof Error ? err.message : "Unknown"}`
          );
        }
      }
    }

    const endTime = Date.now();
    console.log(
      `[AbaresIngestion] Weekly predictions complete in ${endTime - startTime}ms: ` +
        `${predictionsGenerated} predictions for ${statesProcessed.size} states, ${cropsProcessed.size} crops`
    );

    return {
      predictionsGenerated,
      statesProcessed: statesProcessed.size,
      cropsProcessed: cropsProcessed.size,
      errors,
    };
  } catch (error) {
    logger.error("ABARES", "Critical error in yield predictions:", error);
    throw error;
  }
}

/**
 * Weekly Supply Forecast Generation Job
 * Generates 180-day supply availability forecasts for key regions
 * Runs every Sunday at 4:00 AM
 */
export async function weeklySupplyForecasts(): Promise<{
  forecastsGenerated: number;
  regionsProcessed: number;
  errors: string[];
}> {
  logger.info("ABARES", "Starting weekly supply forecast generation...");

  const startTime = Date.now();
  const errors: string[] = [];
  let forecastsGenerated = 0;
  const regionsProcessed = new Set<string>();

  // Key bioenergy regions in Australia
  const BIOENERGY_REGIONS = [
    { name: "Darling Downs", state: "QLD" as AustralianState },
    { name: "Liverpool Plains", state: "NSW" as AustralianState },
    { name: "Wimmera", state: "VIC" as AustralianState },
    { name: "Mid North", state: "SA" as AustralianState },
    { name: "Geraldton Zone", state: "WA" as AustralianState },
    { name: "Central Queensland", state: "QLD" as AustralianState },
    { name: "Riverina", state: "NSW" as AustralianState },
    { name: "Mallee", state: "VIC" as AustralianState },
  ];

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const connector = new ABARESConnector(CONNECTOR_CONFIGS.abares);

    for (const region of BIOENERGY_REGIONS) {
      try {
        // Get intelligence for risk assessment
        const intelligence = await connector.getIntelligence();

        // Calculate supply risk factors based on forecasts
        const stateForecasts = intelligence.cropForecasts.filter(
          (f) => f.state === region.state
        );

        // Calculate 180-day forecast
        const forecastDays: Array<{
          date: Date;
          availableTonnes: number;
          confidenceLevel: number;
          riskFactors: string[];
        }> = [];

        const today = new Date();
        for (let i = 0; i < 180; i += 7) {
          // Weekly intervals
          const forecastDate = new Date(today);
          forecastDate.setDate(today.getDate() + i);

          // Calculate seasonal availability (simplified model)
          const month = forecastDate.getMonth();
          const isHarvestPeriod = month >= 10 || month <= 2; // Nov-Feb for summer crops
          const isPlantingPeriod = month >= 3 && month <= 5; // Apr-Jun for winter crops

          // Base availability from forecasts
          const totalForecastProduction = stateForecasts.reduce(
            (sum, f) => sum + (f.production || 0),
            0
          );
          const weeklyAvailability = totalForecastProduction / 52;

          // Seasonal adjustment
          let seasonalMultiplier = 1.0;
          if (isHarvestPeriod) seasonalMultiplier = 1.5;
          if (isPlantingPeriod) seasonalMultiplier = 0.7;

          // Risk factors
          const riskFactors: string[] = [];
          if (!isHarvestPeriod && !isPlantingPeriod) {
            riskFactors.push("off_season_storage_dependency");
          }

          // Check for forecast production issues
          const lowYieldCrops = stateForecasts.filter(
            (f) => f.yieldChange && f.yieldChange < -10
          );
          if (lowYieldCrops.length > 0) {
            riskFactors.push("reduced_yield_forecast");
          }

          forecastDays.push({
            date: forecastDate,
            availableTonnes: Math.round(weeklyAvailability * seasonalMultiplier),
            confidenceLevel: isHarvestPeriod ? 0.85 : 0.7,
            riskFactors,
          });
        }

        // Store supply forecast
        await db.insert(abaresSupplyForecasts).values({
          region: region.name,
          state: region.state,
          forecastDate: today,
          horizonDays: 180,
          forecastData: JSON.stringify(forecastDays),
          riskScore: calculateRiskScore(forecastDays),
          confidenceLevel: averageConfidence(forecastDays),
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        forecastsGenerated++;
        regionsProcessed.add(region.name);
      } catch (err) {
        errors.push(
          `Failed forecast for ${region.name}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    const endTime = Date.now();
    console.log(
      `[AbaresIngestion] Weekly supply forecasts complete in ${endTime - startTime}ms: ` +
        `${forecastsGenerated} forecasts for ${regionsProcessed.size} regions`
    );

    return {
      forecastsGenerated,
      regionsProcessed: regionsProcessed.size,
      errors,
    };
  } catch (error) {
    logger.error("ABARES", "Critical error in supply forecasts:", error);
    throw error;
  }
}

/**
 * Monthly Farm Benchmark Update Job
 * Fetches updated farm financial benchmarks from ABARES farm surveys
 * Runs on the 1st of each month at 2:00 AM
 */
export async function monthlyFarmBenchmarks(): Promise<{
  benchmarksUpdated: number;
  statesProcessed: number;
  errors: string[];
}> {
  logger.info("ABARES", "Starting monthly farm benchmark update...");

  const startTime = Date.now();
  const errors: string[] = [];
  let benchmarksUpdated = 0;
  const statesProcessed = new Set<string>();

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const connector = new ABARESConnector(CONNECTOR_CONFIGS.abares);

    // Fetch comprehensive intelligence including benchmarks
    const intelligence = await connector.getIntelligence();

    for (const benchmark of intelligence.farmBenchmarks) {
      try {
        await upsertFarmBenchmark(db, benchmark);
        benchmarksUpdated++;
        statesProcessed.add(benchmark.state);
      } catch (err) {
        errors.push(
          `Failed benchmark for ${benchmark.farmType}/${benchmark.state}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    const endTime = Date.now();
    console.log(
      `[AbaresIngestion] Monthly benchmark update complete in ${endTime - startTime}ms: ` +
        `${benchmarksUpdated} benchmarks for ${statesProcessed.size} states`
    );

    return {
      benchmarksUpdated,
      statesProcessed: statesProcessed.size,
      errors,
    };
  } catch (error) {
    logger.error("ABARES", "Critical error in farm benchmarks:", error);
    throw error;
  }
}

// Helper functions

async function processCropForecastSignal(db: any, signal: any): Promise<void> {
  // Parse signal metadata into CropForecast
  const forecast: Partial<CropForecast> = {
    crop: signal.metadata?.crop || "unknown",
    state: signal.metadata?.state || "NSW",
    season: signal.metadata?.season || getCurrentSeason(),
    area: signal.metadata?.area,
    production: signal.metadata?.production,
    yield: signal.metadata?.yield,
    yieldChange: signal.metadata?.yieldChange,
    productionChange: signal.metadata?.productionChange,
    forecastDate: new Date(signal.discoveredAt),
  };

  await upsertCropForecast(db, forecast as CropForecast);
}

async function processCommodityPriceSignal(db: any, signal: any): Promise<void> {
  const price: Partial<CommodityPrice> = {
    commodity: signal.metadata?.commodity || "unknown",
    priceAud: signal.metadata?.price || 0,
    priceUnit: signal.metadata?.unit || "tonne",
    priceDate: new Date(signal.discoveredAt),
    weekChange: signal.metadata?.weekChange,
    monthChange: signal.metadata?.monthChange,
    yearChange: signal.metadata?.yearChange,
  };

  await upsertCommodityPrice(db, price as CommodityPrice);
}

async function upsertCropForecast(db: any, forecast: CropForecast): Promise<void> {
  // Check for existing record
  const existing = await db
    .select()
    .from(abaresCropForecasts)
    .where(
      and(
        eq(abaresCropForecasts.crop, forecast.crop),
        eq(abaresCropForecasts.cropState, forecast.state),
        eq(abaresCropForecasts.season, forecast.season)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(abaresCropForecasts)
      .set({
        area: forecast.area,
        production: forecast.production,
        yieldPerHa: forecast.yield,
        yieldChange: forecast.yieldChange,
        productionChange: forecast.productionChange,
        reportDate: forecast.forecastDate,
        updatedAt: new Date(),
      })
      .where(eq(abaresCropForecasts.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(abaresCropForecasts).values({
      reportDate: forecast.forecastDate || new Date(),
      season: forecast.season,
      crop: forecast.crop,
      cropState: forecast.state,
      area: forecast.area || 0,
      production: forecast.production || 0,
      yieldPerHa: forecast.yield || 0,
      yieldChange: forecast.yieldChange || 0,
      productionChange: forecast.productionChange || 0,
      source: "abares",
      createdAt: new Date(),
    });
  }
}

async function upsertCommodityPrice(db: any, price: CommodityPrice): Promise<void> {
  // Check for existing record for same commodity and date
  const existing = await db
    .select()
    .from(abaresCommodityPrices)
    .where(
      and(
        eq(abaresCommodityPrices.commodity, price.commodity),
        eq(
          sql`DATE(${abaresCommodityPrices.priceDate})`,
          sql`DATE(${price.priceDate})`
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(abaresCommodityPrices)
      .set({
        priceAud: price.priceAud,
        priceUnit: price.priceUnit,
        weekChange: price.weekChange,
        monthChange: price.monthChange,
        yearChange: price.yearChange,
        updatedAt: new Date(),
      })
      .where(eq(abaresCommodityPrices.id, existing[0].id));
  } else {
    await db.insert(abaresCommodityPrices).values({
      commodity: price.commodity,
      priceDate: price.priceDate || new Date(),
      priceAud: price.priceAud,
      priceUnit: price.priceUnit || "tonne",
      weekChange: price.weekChange || 0,
      monthChange: price.monthChange || 0,
      yearChange: price.yearChange || 0,
      fiveYearAvg: price.fiveYearAvg || 0,
      source: "abares",
      createdAt: new Date(),
    });
  }
}

async function upsertFarmBenchmark(db: any, benchmark: FarmBenchmark): Promise<void> {
  const existing = await db
    .select()
    .from(abaresFarmBenchmarks)
    .where(
      and(
        eq(abaresFarmBenchmarks.farmType, benchmark.farmType),
        eq(abaresFarmBenchmarks.benchmarkState, benchmark.state),
        eq(abaresFarmBenchmarks.financialYear, benchmark.financialYear)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(abaresFarmBenchmarks)
      .set({
        grossFarmIncome: benchmark.grossFarmIncome,
        totalCashCosts: benchmark.totalCashCosts,
        farmCashIncome: benchmark.farmCashIncome,
        farmBusinessProfit: benchmark.farmBusinessProfit,
        rateOfReturn: benchmark.rateOfReturn,
        debtToEquity: benchmark.debtToEquity,
        sampleSize: benchmark.sampleSize,
        updatedAt: new Date(),
      })
      .where(eq(abaresFarmBenchmarks.id, existing[0].id));
  } else {
    await db.insert(abaresFarmBenchmarks).values({
      farmType: benchmark.farmType,
      benchmarkState: benchmark.state,
      financialYear: benchmark.financialYear,
      grossFarmIncome: benchmark.grossFarmIncome || 0,
      totalCashCosts: benchmark.totalCashCosts || 0,
      farmCashIncome: benchmark.farmCashIncome || 0,
      farmBusinessProfit: benchmark.farmBusinessProfit || 0,
      rateOfReturn: benchmark.rateOfReturn || 0,
      debtToEquity: benchmark.debtToEquity || 0,
      sampleSize: benchmark.sampleSize || 0,
      source: "abares_farm_survey",
      createdAt: new Date(),
    });
  }
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function calculateRiskScore(
  forecasts: Array<{ riskFactors: string[]; confidenceLevel: number }>
): number {
  // Higher risk score = more risk
  let totalRisk = 0;
  for (const f of forecasts) {
    totalRisk += f.riskFactors.length * 10;
    totalRisk += (1 - f.confidenceLevel) * 20;
  }
  return Math.min(100, Math.round(totalRisk / forecasts.length));
}

function averageConfidence(
  forecasts: Array<{ confidenceLevel: number }>
): number {
  if (forecasts.length === 0) return 0;
  const sum = forecasts.reduce((acc, f) => acc + f.confidenceLevel, 0);
  return Math.round((sum / forecasts.length) * 100) / 100;
}

/**
 * Run all ABARES ingestion jobs (for manual trigger or testing)
 */
export async function runAllAbaresJobs(): Promise<{
  dailyIngestion: Awaited<ReturnType<typeof dailyAbaresIngestion>>;
  yieldPredictions: Awaited<ReturnType<typeof weeklyYieldPredictions>>;
  supplyForecasts: Awaited<ReturnType<typeof weeklySupplyForecasts>>;
  farmBenchmarks: Awaited<ReturnType<typeof monthlyFarmBenchmarks>>;
}> {
  logger.info("ABARES", "Running all ABARES ingestion jobs...");

  const results = {
    dailyIngestion: await dailyAbaresIngestion(),
    yieldPredictions: await weeklyYieldPredictions(),
    supplyForecasts: await weeklySupplyForecasts(),
    farmBenchmarks: await monthlyFarmBenchmarks(),
  };

  logger.info("ABARES", "All ABARES jobs complete:", results);
  return results;
}
