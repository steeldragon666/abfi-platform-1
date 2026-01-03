/**
 * BOM Climate Data Ingestion Jobs
 * Scheduled jobs for ingesting climate data from BOM and SILO sources
 */

import { getDb } from "./db";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import {
  siloClimateData,
  bomObservations,
  bomForecasts,
  seasonalOutlooks,
  bomWarnings,
  agriculturalClimateMetrics,
  bomIngestionRuns,
  properties,
  suppliers,
} from "../drizzle/schema";
import {
  createBOMConnector,
  AGRICULTURAL_REGIONS,
  SILOTimeSeries,
} from "./connectors/bomConnector";
import { climateIntelligenceService } from "./services/climateIntelligenceService";

/**
 * Daily SILO Climate Data Ingestion
 * Fetches the latest climate data from SILO for all agricultural regions
 */
export async function dailySiloIngestion(): Promise<{
  success: boolean;
  recordsIngested: number;
  regions: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting daily SILO ingestion...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let totalRecords = 0;
  let regionsProcessed = 0;

  // Record ingestion run start
  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "silo_historical",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  const connector = createBOMConnector();

  // Get data for yesterday (SILO data is typically 1 day delayed)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  try {
    for (const region of AGRICULTURAL_REGIONS) {
      try {
        console.log(`[BOM Ingestion] Fetching SILO data for ${region.name}...`);

        const climateData = await connector.fetchSILOData(
          region.lat,
          region.lng,
          dateStr,
          dateStr,
          ["daily_rain", "max_temp", "min_temp", "evap_pan", "radiation", "vp_deficit"]
        );

        // Insert data into database
        for (const point of climateData.data) {
          await db.insert(siloClimateData).values({
            latitude: region.lat.toString(),
            longitude: region.lng.toString(),
            stationName: region.name,
            date: point.date,
            dailyRainMm: point.variables.daily_rain?.toString() || null,
            maxTempC: point.variables.max_temp?.toString() || null,
            minTempC: point.variables.min_temp?.toString() || null,
            evapPanMm: point.variables.evap_pan?.toString() || null,
            solarRadiationMJ: point.variables.radiation?.toString() || null,
            vpDeficitHPa: point.variables.vp_deficit?.toString() || null,
            qualityCodes: point.quality,
          });
          totalRecords++;
        }

        regionsProcessed++;
      } catch (error) {
        const errMsg = `Failed to ingest SILO data for ${region.name}: ${error}`;
        console.error(`[BOM Ingestion] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    // Update run record
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: AGRICULTURAL_REGIONS.length,
        recordsOut: totalRecords,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
        errorDetails: errors.length > 0 ? { errors, warnings: [] } : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] SILO ingestion complete. ${totalRecords} records, ${regionsProcessed} regions.`);

    return {
      success: errors.length === 0,
      recordsIngested: totalRecords,
      regions: regionsProcessed,
      errors,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: errMsg,
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Hourly BOM Observations Ingestion
 * Fetches current weather observations from BOM for agricultural regions
 */
export async function hourlyObservationsIngestion(): Promise<{
  success: boolean;
  observationsIngested: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting hourly observations ingestion...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let totalObservations = 0;

  // Record ingestion run
  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "observations",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  const connector = createBOMConnector();

  try {
    for (const region of AGRICULTURAL_REGIONS) {
      try {
        const observation = await connector.fetchNearestObservation(region.lat, region.lng);

        if (observation) {
          await db.insert(bomObservations).values({
            stationId: observation.stationId,
            stationName: observation.stationName,
            state: region.state as any,
            latitude: observation.latitude.toString(),
            longitude: observation.longitude.toString(),
            observationTime: new Date(observation.timestamp),
            temperatureC: observation.temperature?.toString() || null,
            apparentTempC: observation.apparentTemperature?.toString() || null,
            dewPointC: observation.dewPoint?.toString() || null,
            humidityPercent: observation.humidity || null,
            windSpeedKmh: observation.windSpeed?.toString() || null,
            windGustKmh: observation.windGust?.toString() || null,
            windDirection: observation.windDirection || null,
            pressureHPa: observation.pressure?.toString() || null,
            rainfallSince9amMm: observation.rainfallSince9am?.toString() || null,
            cloudCover: observation.cloudCover || null,
          });
          totalObservations++;
        }
      } catch (error) {
        const errMsg = `Failed to fetch observation for ${region.name}: ${error}`;
        console.error(`[BOM Ingestion] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: AGRICULTURAL_REGIONS.length,
        recordsOut: totalObservations,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] Observations ingestion complete. ${totalObservations} records.`);

    return {
      success: errors.length === 0,
      observationsIngested: totalObservations,
      errors,
    };
  } catch (error) {
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Daily Forecast Ingestion
 * Fetches 7-day weather forecasts for agricultural regions
 */
export async function dailyForecastIngestion(): Promise<{
  success: boolean;
  forecastsIngested: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting daily forecast ingestion...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let totalForecasts = 0;

  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "forecasts",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  const connector = createBOMConnector();

  try {
    for (const region of AGRICULTURAL_REGIONS) {
      try {
        const forecast = await connector.fetchForecast(region.lat, region.lng);

        if (forecast) {
          for (const day of forecast.days) {
            await db.insert(bomForecasts).values({
              locationName: region.name,
              state: region.state as any,
              latitude: forecast.location.latitude.toString(),
              longitude: forecast.location.longitude.toString(),
              issueTime: new Date(forecast.issueTime),
              forecastDate: day.date,
              minTempC: day.minTemp?.toString() || null,
              maxTempC: day.maxTemp?.toString() || null,
              precis: day.precis || null,
              precipitationProbability: day.precipitation?.probability || null,
              precipitationRangeMin: day.precipitation?.amount?.min?.toString() || null,
              precipitationRangeMax: day.precipitation?.amount?.max?.toString() || null,
              uvIndex: day.uv?.index || null,
              uvCategory: day.uv?.category || null,
              fireWeatherRating: day.fireWeather?.rating || null,
              fireWeatherIndex: day.fireWeather?.index || null,
            });
            totalForecasts++;
          }
        }
      } catch (error) {
        const errMsg = `Failed to fetch forecast for ${region.name}: ${error}`;
        console.error(`[BOM Ingestion] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: AGRICULTURAL_REGIONS.length * 7,
        recordsOut: totalForecasts,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] Forecast ingestion complete. ${totalForecasts} records.`);

    return {
      success: errors.length === 0,
      forecastsIngested: totalForecasts,
      errors,
    };
  } catch (error) {
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Monthly Seasonal Outlook Ingestion
 * Fetches 3-month climate outlook from BOM
 */
export async function monthlySeasonalOutlookIngestion(): Promise<{
  success: boolean;
  outlooksIngested: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting monthly seasonal outlook ingestion...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let totalOutlooks = 0;

  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "seasonal_outlook",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  const connector = createBOMConnector();

  try {
    const outlooks = await connector.fetchSeasonalOutlook();

    for (const outlook of outlooks) {
      try {
        // Find the corresponding region to get state
        const region = AGRICULTURAL_REGIONS.find(r => r.name === outlook.region);

        await db.insert(seasonalOutlooks).values({
          issueDate: outlook.issueDate,
          validPeriodStart: outlook.validPeriod.start,
          validPeriodEnd: outlook.validPeriod.end,
          validPeriodMonths: outlook.validPeriod.months,
          region: outlook.region,
          state: region?.state as any || null,
          rainBelowMedianPercent: outlook.rainfall.tercileProbabilities.belowMedian,
          rainNearMedianPercent: outlook.rainfall.tercileProbabilities.nearMedian,
          rainAboveMedianPercent: outlook.rainfall.tercileProbabilities.aboveMedian,
          medianRainfallMm: outlook.rainfall.medianRainfall.toString(),
          maxTempBelowMedianPercent: outlook.temperature.maxTempOutlook.belowMedian,
          maxTempNearMedianPercent: outlook.temperature.maxTempOutlook.nearMedian,
          maxTempAboveMedianPercent: outlook.temperature.maxTempOutlook.aboveMedian,
          minTempBelowMedianPercent: outlook.temperature.minTempOutlook.belowMedian,
          minTempNearMedianPercent: outlook.temperature.minTempOutlook.nearMedian,
          minTempAboveMedianPercent: outlook.temperature.minTempOutlook.aboveMedian,
        });
        totalOutlooks++;
      } catch (error) {
        const errMsg = `Failed to insert outlook for ${outlook.region}: ${error}`;
        console.error(`[BOM Ingestion] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: outlooks.length,
        recordsOut: totalOutlooks,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] Seasonal outlook ingestion complete. ${totalOutlooks} records.`);

    return {
      success: errors.length === 0,
      outlooksIngested: totalOutlooks,
      errors,
    };
  } catch (error) {
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Hourly Weather Warnings Check
 * Checks for active weather warnings and stores them
 */
export async function hourlyWarningsCheck(): Promise<{
  success: boolean;
  activeWarnings: number;
  newWarnings: number;
  expiredWarnings: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting hourly warnings check...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let newWarnings = 0;
  let expiredWarnings = 0;

  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "warnings",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  const connector = createBOMConnector();

  try {
    // Fetch current warnings
    const warnings = await connector.fetchActiveWarnings();

    // Get existing active warnings from database
    const existingWarnings = await db
      .select()
      .from(bomWarnings)
      .where(eq(bomWarnings.active, true));

    const existingWarningIds = new Set(existingWarnings.map(w => w.warningId));
    const currentWarningIds = new Set(warnings.map(w => w.id));

    // Insert new warnings
    for (const warning of warnings) {
      if (!existingWarningIds.has(warning.id)) {
        try {
          await db.insert(bomWarnings).values({
            warningId: warning.id,
            warningType: warning.type as any,
            severity: warning.severity as any,
            title: warning.title,
            description: warning.description,
            issueTime: new Date(warning.issueTime),
            expiryTime: warning.expiryTime ? new Date(warning.expiryTime) : null,
            affectedAreas: warning.affectedAreas,
            coordinates: warning.coordinates || null,
            active: true,
          });
          newWarnings++;
        } catch (error) {
          const errMsg = `Failed to insert warning ${warning.id}: ${error}`;
          console.error(`[BOM Ingestion] ${errMsg}`);
          errors.push(errMsg);
        }
      }
    }

    // Mark expired warnings as inactive
    for (const existing of existingWarnings) {
      if (!currentWarningIds.has(existing.warningId)) {
        await db.update(bomWarnings)
          .set({ active: false })
          .where(eq(bomWarnings.warningId, existing.warningId));
        expiredWarnings++;
      }
    }

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: warnings.length,
        recordsOut: newWarnings,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] Warnings check complete. ${newWarnings} new, ${expiredWarnings} expired.`);

    return {
      success: errors.length === 0,
      activeWarnings: warnings.length,
      newWarnings,
      expiredWarnings,
      errors,
    };
  } catch (error) {
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Weekly Climate Metrics Calculation
 * Calculates agricultural climate metrics for all properties
 */
export async function weeklyClimateMetricsCalculation(): Promise<{
  success: boolean;
  propertiesProcessed: number;
  metricsGenerated: number;
  errors: string[];
}> {
  console.log("[BOM Ingestion] Starting weekly climate metrics calculation...");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runStartTime = new Date();
  const errors: string[] = [];
  let propertiesProcessed = 0;
  let metricsGenerated = 0;

  const runResult = await db.insert(bomIngestionRuns).values({
    runType: "climate_metrics",
    startedAt: runStartTime,
    status: "started",
  });
  const runId = runResult.insertId;

  try {
    // Get all properties with coordinates
    const allProperties = await db
      .select()
      .from(properties)
      .where(and(
        isNotNull(properties.latitude),
        isNotNull(properties.longitude)
      ));

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (const property of allProperties) {
      if (!property.latitude || !property.longitude) continue;

      try {
        const metrics = await climateIntelligenceService.getGrowingSeasonMetrics(
          parseFloat(property.latitude),
          parseFloat(property.longitude),
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        );

        await climateIntelligenceService.storeClimateMetrics(metrics, {
          propertyId: property.id,
          supplierId: property.supplierId || undefined,
        });

        propertiesProcessed++;
        metricsGenerated++;
      } catch (error) {
        const errMsg = `Failed to calculate metrics for property ${property.id}: ${error}`;
        console.error(`[BOM Ingestion] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: errors.length > 0 ? "partial" : "succeeded",
        recordsIn: allProperties.length,
        recordsOut: metricsGenerated,
        dateRangeStart: startDate.toISOString().split("T")[0],
        dateRangeEnd: endDate.toISOString().split("T")[0],
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      })
      .where(eq(bomIngestionRuns.id, runId));

    console.log(`[BOM Ingestion] Climate metrics calculation complete. ${propertiesProcessed} properties, ${metricsGenerated} metrics.`);

    return {
      success: errors.length === 0,
      propertiesProcessed,
      metricsGenerated,
      errors,
    };
  } catch (error) {
    await db.update(bomIngestionRuns)
      .set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bomIngestionRuns.id, runId));

    throw error;
  }
}

/**
 * Run all BOM ingestion jobs
 * Used for manual triggering or initial data load
 */
export async function runAllBomJobs(): Promise<{
  silo: Awaited<ReturnType<typeof dailySiloIngestion>>;
  observations: Awaited<ReturnType<typeof hourlyObservationsIngestion>>;
  forecasts: Awaited<ReturnType<typeof dailyForecastIngestion>>;
  seasonalOutlook: Awaited<ReturnType<typeof monthlySeasonalOutlookIngestion>>;
  warnings: Awaited<ReturnType<typeof hourlyWarningsCheck>>;
  climateMetrics: Awaited<ReturnType<typeof weeklyClimateMetricsCalculation>>;
}> {
  console.log("[BOM Ingestion] Running all BOM ingestion jobs...");

  const [silo, observations, forecasts, seasonalOutlook, warnings, climateMetrics] = await Promise.all([
    dailySiloIngestion().catch(e => ({ success: false, recordsIngested: 0, regions: 0, errors: [e.message] })),
    hourlyObservationsIngestion().catch(e => ({ success: false, observationsIngested: 0, errors: [e.message] })),
    dailyForecastIngestion().catch(e => ({ success: false, forecastsIngested: 0, errors: [e.message] })),
    monthlySeasonalOutlookIngestion().catch(e => ({ success: false, outlooksIngested: 0, errors: [e.message] })),
    hourlyWarningsCheck().catch(e => ({ success: false, activeWarnings: 0, newWarnings: 0, expiredWarnings: 0, errors: [e.message] })),
    weeklyClimateMetricsCalculation().catch(e => ({ success: false, propertiesProcessed: 0, metricsGenerated: 0, errors: [e.message] })),
  ]);

  console.log("[BOM Ingestion] All jobs complete.");

  return {
    silo,
    observations,
    forecasts,
    seasonalOutlook,
    warnings,
    climateMetrics,
  };
}
