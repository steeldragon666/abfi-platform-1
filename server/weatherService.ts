/**
 * Weather Service - SILO/BOM Integration
 *
 * Provides weather data for RSIE risk assessment using Australian Bureau of Meteorology
 * and SILO (Scientific Information for Land Owners) datasets
 *
 * Data Sources:
 * - BOM: Bureau of Meteorology (observations, forecasts, warnings)
 * - SILO: Long Baseline Data Network (historical climate data)
 *
 * License: CC BY 4.0 (Creative Commons Attribution 4.0 International)
 */

import { getDb } from "./db.js";
import { dataSources, weatherGridDaily, forecastGridHourly, ingestionRuns } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { createBOMConnector, ClimateIntelligence, SILOVariable } from "./connectors/bomConnector.js";
import { climateIntelligenceService } from "./services/climateIntelligenceService.js";

// Initialize BOM connector
const bomConnector = createBOMConnector();

// Australian grid cells for major agricultural regions
export const AUSTRALIAN_GRID_CELLS = [
  // Queensland
  { cellId: "QLD-SEQ", lat: -27.4698, lng: 153.0251, name: "South East Queensland", state: "QLD" },
  { cellId: "QLD-DAR", lat: -27.5598, lng: 151.9507, name: "Darling Downs", state: "QLD" },
  { cellId: "QLD-MAC", lat: -21.1411, lng: 149.1861, name: "Mackay Region", state: "QLD" },
  { cellId: "QLD-BUN", lat: -24.8661, lng: 152.3489, name: "Bundaberg Region", state: "QLD" },
  { cellId: "QLD-CEN", lat: -23.4167, lng: 148.7333, name: "Central Queensland", state: "QLD" },

  // New South Wales
  { cellId: "NSW-SYD", lat: -33.8688, lng: 151.2093, name: "Sydney Basin", state: "NSW" },
  { cellId: "NSW-NEW", lat: -32.9283, lng: 151.7817, name: "Hunter Valley", state: "NSW" },
  { cellId: "NSW-RIV", lat: -34.2833, lng: 146.0333, name: "Riverina", state: "NSW" },
  { cellId: "NSW-NTH", lat: -29.7592, lng: 151.1211, name: "Northern Tablelands", state: "NSW" },
  { cellId: "NSW-LIV", lat: -31.5, lng: 150.5, name: "Liverpool Plains", state: "NSW" },

  // Victoria
  { cellId: "VIC-MEL", lat: -37.8136, lng: 144.9631, name: "Melbourne Region", state: "VIC" },
  { cellId: "VIC-GIP", lat: -38.1, lng: 146.25, name: "Gippsland", state: "VIC" },
  { cellId: "VIC-WIM", lat: -36.75, lng: 142.25, name: "Wimmera", state: "VIC" },
  { cellId: "VIC-MAL", lat: -35.5, lng: 142.0, name: "Mallee", state: "VIC" },
  { cellId: "VIC-WES", lat: -37.9, lng: 143.5, name: "Western Districts", state: "VIC" },

  // South Australia
  { cellId: "SA-ADE", lat: -34.9285, lng: 138.6007, name: "Adelaide Plains", state: "SA" },
  { cellId: "SA-SEA", lat: -35.0, lng: 139.0, name: "South East SA", state: "SA" },
  { cellId: "SA-MID", lat: -33.75, lng: 138.5, name: "Mid North", state: "SA" },
  { cellId: "SA-EYR", lat: -33.5, lng: 136.0, name: "Eyre Peninsula", state: "SA" },

  // Western Australia
  { cellId: "WA-PER", lat: -31.9505, lng: 115.8605, name: "Perth Region", state: "WA" },
  { cellId: "WA-SWC", lat: -33.8, lng: 115.8, name: "South West Coastal", state: "WA" },
  { cellId: "WA-WHE", lat: -31.0, lng: 117.5, name: "Wheatbelt", state: "WA" },

  // Tasmania
  { cellId: "TAS-HOB", lat: -42.8821, lng: 147.3272, name: "Hobart Region", state: "TAS" },
  { cellId: "TAS-NTH", lat: -41.4332, lng: 147.1441, name: "Northern Tasmania", state: "TAS" },
];

interface BOMClimateData {
  observations?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    rainfall?: number;
    pressure?: number;
  };
  forecast?: {
    daily?: Array<{
      date: string;
      temperatureMin?: number;
      temperatureMax?: number;
      precipitationProbability?: number;
      rainfall?: number;
      windSpeed?: number;
    }>;
    hourly?: Array<{
      datetime: string;
      temperature?: number;
      humidity?: number;
      windSpeed?: number;
      rainfall?: number;
    }>;
  };
  warnings?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    issueTime: string;
  }>;
  agricultural?: {
    soilMoisture?: number;
    evapotranspiration?: number;
    frostRisk?: string;
    heatStress?: string;
  };
}

interface SILODataPoint {
  date: string;
  rainfall?: number;
  maxTemp?: number;
  minTemp?: number;
  evaporation?: number;
  radiation?: number;
  vp?: number;
  maxRH?: number;
  minRH?: number;
}

/**
 * Fetch current weather and climate intelligence for a location
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<ClimateIntelligence> {
  try {
    const climateData = await bomConnector.getClimateIntelligence(lat, lng, {
      includeHistorical: true,
    });

    return climateData;
  } catch (error) {
    console.error("[WeatherService] Error fetching current weather:", error);
    throw new Error(`BOM API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Fetch forecast for a location
 */
export async function fetchForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<any> {
  try {
    const forecastData = await bomConnector.fetchForecast(lat, lng);
    return forecastData;
  } catch (error) {
    console.error("[WeatherService] Error fetching forecast:", error);
    throw new Error(`BOM Forecast API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Fetch historical SILO data for a location
 */
export async function fetchHistoricalData(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
  variables?: string[]
): Promise<SILODataPoint[]> {
  try {
    const defaultVariables = variables || [
      "daily_rain",
      "max_temp",
      "min_temp",
      "evap_pan",
      "radiation",
      "vp",
      "rh_tmax",
      "rh_tmin"
    ];

    const siloData = await bomConnector.fetchSILOData(lat, lng, startDate, endDate, defaultVariables as SILOVariable[]);

    // Transform SILO data to standardized format
    const dataPoints: SILODataPoint[] = [];
    if (siloData && Array.isArray(siloData)) {
      for (const point of siloData) {
        dataPoints.push({
          date: point.date,
          rainfall: point.daily_rain,
          maxTemp: point.max_temp,
          minTemp: point.min_temp,
          evaporation: point.evap_pan,
          radiation: point.radiation,
          vp: point.vp,
          maxRH: point.rh_tmax,
          minRH: point.rh_tmin,
        });
      }
    }

    return dataPoints;
  } catch (error) {
    console.error("[WeatherService] Error fetching historical data:", error);
    throw new Error(`SILO API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Ingest weather data for all Australian grid cells using SILO/BOM
 */
export async function ingestWeatherData(): Promise<{
  success: boolean;
  cellsProcessed: number;
  recordsInserted: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get or create SILO/BOM data source
  let siloBomSource = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.sourceKey, "silo_bom"))
    .limit(1);

  if (siloBomSource.length === 0) {
    await db.insert(dataSources).values({
      sourceKey: "silo_bom",
      name: "SILO/BOM Climate Data",
      licenseClass: "CC_BY_4",
      termsUrl: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Climate data from Bureau of Meteorology (BOM) and SILO (Scientific Information for Land Owners). Licensed under CC BY 4.0.",
      isEnabled: true,
    });
    siloBomSource = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.sourceKey, "silo_bom"))
      .limit(1);
  }

  const sourceId = siloBomSource[0].id;

  // Create ingestion run record
  const runResult = await db.insert(ingestionRuns).values({
    sourceId,
    runType: "weather",
    status: "started",
    startedAt: new Date(),
  });
  const runId = Number(runResult[0].insertId);

  let cellsProcessed = 0;
  let recordsInserted = 0;
  const errors: string[] = [];

  for (const cell of AUSTRALIAN_GRID_CELLS) {
    try {
      // Fetch forecast and current data from BOM
      const climateData = await bomConnector.getClimateIntelligence(cell.lat, cell.lng, {
        includeHistorical: true,
      });

      // Fetch recent SILO data (last 7 days for comparison/validation)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const siloData = await bomConnector.fetchSILOData(
        cell.lat,
        cell.lng,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        ["daily_rain", "max_temp", "min_temp", "evap_pan", "radiation"]
      );

      // Process forecast data (daily from BOM)
      if (climateData.forecast?.days && Array.isArray(climateData.forecast.days)) {
        const forecastRunTime = new Date();
        const soilMoistureIndex = climateData.agriculturalMetrics?.soilMoistureIndex;

        for (const dailyPoint of climateData.forecast.days) {
          const rainfallAmount = dailyPoint.precipitation?.amount?.max?.toString() || null;
          await db.insert(forecastGridHourly).values({
            cellId: cell.cellId,
            forecastRunTime,
            hourTime: new Date(dailyPoint.date),
            soilMoisture0_7cm: soilMoistureIndex?.toString() || null,
            soilTemp: null, // BOM doesn't provide soil temp in standard forecast
            et0: null,
            rainfall: rainfallAmount,
            windSpeed: null, // BOM forecast doesn't include wind speed
            sourceId,
            ingestionRunId: runId,
            retrievedAt: new Date(),
          }).onDuplicateKeyUpdate({
            set: {
              soilMoisture0_7cm: soilMoistureIndex?.toString() || null,
              rainfall: rainfallAmount,
              retrievedAt: new Date(),
            },
          });
          recordsInserted++;
        }
      }

      // Process SILO historical data (daily)
      if (siloData && Array.isArray(siloData)) {
        for (const dailyPoint of siloData) {
          await db.insert(weatherGridDaily).values({
            cellId: cell.cellId,
            date: new Date(dailyPoint.date),
            rainfall: dailyPoint.daily_rain?.toString() || null,
            tmax: dailyPoint.max_temp?.toString() || null,
            tmin: dailyPoint.min_temp?.toString() || null,
            et0: dailyPoint.evap_pan?.toString() || null,
            radiation: dailyPoint.radiation?.toString() || null,
            sourceId,
            ingestionRunId: runId,
            retrievedAt: new Date(),
          }).onDuplicateKeyUpdate({
            set: {
              rainfall: dailyPoint.daily_rain?.toString() || null,
              tmax: dailyPoint.max_temp?.toString() || null,
              tmin: dailyPoint.min_temp?.toString() || null,
              retrievedAt: new Date(),
            },
          });
          recordsInserted++;
        }
      }

      cellsProcessed++;

      // Rate limiting - be respectful to BOM/SILO services
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      errors.push(`${cell.cellId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Complete ingestion run
  await db.update(ingestionRuns)
    .set({
      status: errors.length === 0 ? "succeeded" : errors.length < AUSTRALIAN_GRID_CELLS.length ? "partial" : "failed",
      finishedAt: new Date(),
      recordsIn: cellsProcessed,
      recordsOut: recordsInserted,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    })
    .where(eq(ingestionRuns.id, runId));

  return {
    success: errors.length === 0,
    cellsProcessed,
    recordsInserted,
    errors,
  };
}

/**
 * Get weather alerts/warnings for a location from BOM
 */
export async function getWeatherAlerts(lat: number, lng: number): Promise<any[]> {
  try {
    // Fetch climate intelligence with warnings
    const climateData = await bomConnector.getClimateIntelligence(lat, lng, {
      includeHistorical: false,
    });

    const alerts: any[] = [];

    // Process BOM warnings
    if (climateData.activeWarnings && Array.isArray(climateData.activeWarnings)) {
      for (const warning of climateData.activeWarnings) {
        alerts.push({
          type: warning.type || "general",
          severity: warning.severity || "medium",
          message: warning.title || warning.description,
          description: warning.description,
          issueTime: warning.issueTime,
          source: "BOM",
        });
      }
    }

    // Add agricultural risk alerts based on current observations
    if (climateData.currentObservations && climateData.currentObservations.length > 0) {
      const obs = climateData.currentObservations[0]; // Get most recent observation

      // Extreme heat
      if (obs.temperature && obs.temperature > 40) {
        alerts.push({
          type: "heatwave",
          severity: obs.temperature > 45 ? "critical" : "high",
          message: `Extreme temperature: ${obs.temperature}°C`,
          value: obs.temperature,
          source: "BOM",
        });
      }

      // Frost risk
      if (obs.temperature && obs.temperature < 2) {
        alerts.push({
          type: "frost",
          severity: obs.temperature < 0 ? "high" : "medium",
          message: `Frost risk: ${obs.temperature}°C`,
          value: obs.temperature,
          source: "BOM",
        });
      }

      // High winds
      if (obs.windSpeed && obs.windSpeed > 60) {
        alerts.push({
          type: "wind",
          severity: obs.windSpeed > 90 ? "critical" : "high",
          message: `High winds: ${obs.windSpeed} km/h`,
          value: obs.windSpeed,
          source: "BOM",
        });
      }

      // Heavy rain
      if (obs.rainfall && obs.rainfall > 10) {
        alerts.push({
          type: "flood",
          severity: obs.rainfall > 30 ? "critical" : "high",
          message: `Heavy rainfall: ${obs.rainfall} mm`,
          value: obs.rainfall,
          source: "BOM",
        });
      }
    }

    // Add agricultural-specific alerts
    if (climateData.agriculturalMetrics) {
      if (climateData.agriculturalMetrics.frostRisk && climateData.agriculturalMetrics.frostRisk !== "low") {
        alerts.push({
          type: "frost_risk",
          severity: climateData.agriculturalMetrics.frostRisk,
          message: `Frost risk: ${climateData.agriculturalMetrics.frostRisk}`,
          source: "Agricultural Intelligence",
        });
      }

      if (climateData.agriculturalMetrics.heatStressRisk && climateData.agriculturalMetrics.heatStressRisk !== "low") {
        alerts.push({
          type: "heat_stress",
          severity: climateData.agriculturalMetrics.heatStressRisk,
          message: `Heat stress risk: ${climateData.agriculturalMetrics.heatStressRisk}`,
          source: "Agricultural Intelligence",
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("[WeatherService] Error fetching alerts:", error);
    return [];
  }
}

/**
 * Check if SILO/BOM services are available and working
 */
export async function checkWeatherApiStatus(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
  services?: {
    bom: boolean;
    silo: boolean;
  };
}> {
  try {
    // Test with Sydney coordinates
    const testLat = -33.8688;
    const testLng = 151.2093;

    let bomWorking = false;
    let siloWorking = false;

    // Test BOM climate intelligence
    try {
      await bomConnector.getClimateIntelligence(testLat, testLng, {
        includeHistorical: false,
      });
      bomWorking = true;
    } catch (error) {
      console.error("[WeatherService] BOM test failed:", error);
    }

    // Test SILO data access
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      await bomConnector.fetchSILOData(
        testLat,
        testLng,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        ["daily_rain"] as SILOVariable[]
      );
      siloWorking = true;
    } catch (error) {
      console.error("[WeatherService] SILO test failed:", error);
    }

    const working = bomWorking && siloWorking;

    return {
      configured: true,
      working,
      services: {
        bom: bomWorking,
        silo: siloWorking,
      },
      error: !working ? "One or more services unavailable" : undefined,
    };
  } catch (error) {
    return {
      configured: true,
      working: false,
      error: error instanceof Error ? error.message : "Unknown error",
      services: {
        bom: false,
        silo: false,
      },
    };
  }
}
