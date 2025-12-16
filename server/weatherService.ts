/**
 * Weather Service - Tomorrow.io Integration
 *
 * Provides weather data for RSIE risk assessment
 * API Docs: https://docs.tomorrow.io/reference/welcome
 */

import { getDb } from "./db.js";
import { dataSources, weatherGridDaily, forecastGridHourly, ingestionRuns } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const TOMORROW_IO_API_KEY = process.env.TOMORROW_IO_API_KEY;
const TOMORROW_IO_BASE_URL = "https://api.tomorrow.io/v4";

// Australian grid cells for major agricultural regions
export const AUSTRALIAN_GRID_CELLS = [
  // Queensland
  { cellId: "QLD-SEQ", lat: -27.4698, lng: 153.0251, name: "South East Queensland" },
  { cellId: "QLD-DAR", lat: -27.5598, lng: 151.9507, name: "Darling Downs" },
  { cellId: "QLD-MAC", lat: -21.1411, lng: 149.1861, name: "Mackay Region" },
  { cellId: "QLD-BUN", lat: -24.8661, lng: 152.3489, name: "Bundaberg Region" },
  // New South Wales
  { cellId: "NSW-SYD", lat: -33.8688, lng: 151.2093, name: "Sydney Basin" },
  { cellId: "NSW-NEW", lat: -32.9283, lng: 151.7817, name: "Hunter Valley" },
  { cellId: "NSW-RIV", lat: -34.2833, lng: 146.0333, name: "Riverina" },
  { cellId: "NSW-NTH", lat: -29.7592, lng: 151.1211, name: "Northern Tablelands" },
  // Victoria
  { cellId: "VIC-MEL", lat: -37.8136, lng: 144.9631, name: "Melbourne Region" },
  { cellId: "VIC-GIP", lat: -38.1, lng: 146.25, name: "Gippsland" },
  { cellId: "VIC-WIM", lat: -36.75, lng: 142.25, name: "Wimmera" },
  // South Australia
  { cellId: "SA-ADE", lat: -34.9285, lng: 138.6007, name: "Adelaide Plains" },
  { cellId: "SA-SEA", lat: -35.0, lng: 139.0, name: "South East SA" },
  // Western Australia
  { cellId: "WA-PER", lat: -31.9505, lng: 115.8605, name: "Perth Region" },
  { cellId: "WA-SWC", lat: -33.8, lng: 115.8, name: "South West Coastal" },
  // Tasmania
  { cellId: "TAS-HOB", lat: -42.8821, lng: 147.3272, name: "Hobart Region" },
  { cellId: "TAS-NTH", lat: -41.4332, lng: 147.1441, name: "Northern Tasmania" },
];

interface TomorrowWeatherData {
  data: {
    timelines: Array<{
      timestep: string;
      startTime: string;
      endTime: string;
      intervals: Array<{
        startTime: string;
        values: {
          temperature?: number;
          temperatureMin?: number;
          temperatureMax?: number;
          humidity?: number;
          precipitationIntensity?: number;
          precipitationProbability?: number;
          windSpeed?: number;
          windDirection?: number;
          pressureSurfaceLevel?: number;
          uvIndex?: number;
          weatherCode?: number;
          fireIndex?: number;
          soilMoistureVolumetric0To10?: number;
          soilTemperature0To10?: number;
          evapotranspiration?: number;
        };
      }>;
    }>;
  };
}

/**
 * Fetch current weather for a location
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<any> {
  if (!TOMORROW_IO_API_KEY) {
    throw new Error("Tomorrow.io API key not configured");
  }

  const url = `${TOMORROW_IO_BASE_URL}/weather/realtime?location=${lat},${lng}&apikey=${TOMORROW_IO_API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Tomorrow.io API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch hourly forecast for a location
 */
export async function fetchHourlyForecast(
  lat: number,
  lng: number,
  hours: number = 168 // 7 days
): Promise<TomorrowWeatherData> {
  if (!TOMORROW_IO_API_KEY) {
    throw new Error("Tomorrow.io API key not configured");
  }

  const fields = [
    "temperature",
    "temperatureMin",
    "temperatureMax",
    "humidity",
    "precipitationIntensity",
    "precipitationProbability",
    "windSpeed",
    "windDirection",
    "pressureSurfaceLevel",
    "uvIndex",
    "weatherCode",
  ].join(",");

  const url = `${TOMORROW_IO_BASE_URL}/timelines?location=${lat},${lng}&fields=${fields}&timesteps=1h&units=metric&apikey=${TOMORROW_IO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Tomorrow.io API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch daily forecast for a location
 */
export async function fetchDailyForecast(
  lat: number,
  lng: number,
  days: number = 14
): Promise<TomorrowWeatherData> {
  if (!TOMORROW_IO_API_KEY) {
    throw new Error("Tomorrow.io API key not configured");
  }

  const fields = [
    "temperatureMin",
    "temperatureMax",
    "precipitationIntensity",
    "precipitationProbability",
    "humidity",
    "windSpeed",
    "uvIndex",
  ].join(",");

  const url = `${TOMORROW_IO_BASE_URL}/timelines?location=${lat},${lng}&fields=${fields}&timesteps=1d&units=metric&apikey=${TOMORROW_IO_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Tomorrow.io API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Ingest weather data for all Australian grid cells
 */
export async function ingestWeatherData(): Promise<{
  success: boolean;
  cellsProcessed: number;
  recordsInserted: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get or create Tomorrow.io data source
  let tomorrowSource = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.sourceKey, "tomorrow_io"))
    .limit(1);

  if (tomorrowSource.length === 0) {
    await db.insert(dataSources).values({
      sourceKey: "tomorrow_io",
      name: "Tomorrow.io Weather API",
      licenseClass: "COMMERCIAL",
      termsUrl: "https://www.tomorrow.io/terms-of-service/",
      attributionText: "Weather data provided by Tomorrow.io",
      isEnabled: true,
    });
    tomorrowSource = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.sourceKey, "tomorrow_io"))
      .limit(1);
  }

  const sourceId = tomorrowSource[0].id;

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
      // Fetch forecast data
      const forecastData = await fetchHourlyForecast(cell.lat, cell.lng, 72);

      if (forecastData.data?.timelines?.[0]?.intervals) {
        const intervals = forecastData.data.timelines[0].intervals;
        const forecastRunTime = new Date();

        for (const interval of intervals) {
          await db.insert(forecastGridHourly).values({
            cellId: cell.cellId,
            forecastRunTime,
            hourTime: new Date(interval.startTime),
            soilMoisture0_7cm: interval.values.soilMoistureVolumetric0To10?.toString() || null,
            soilTemp: interval.values.soilTemperature0To10?.toString() || null,
            et0: interval.values.evapotranspiration?.toString() || null,
            rainfall: interval.values.precipitationIntensity?.toString() || null,
            windSpeed: interval.values.windSpeed?.toString() || null,
            sourceId,
            ingestionRunId: runId,
            retrievedAt: new Date(),
          }).onDuplicateKeyUpdate({
            set: {
              soilMoisture0_7cm: interval.values.soilMoistureVolumetric0To10?.toString() || null,
              rainfall: interval.values.precipitationIntensity?.toString() || null,
              retrievedAt: new Date(),
            },
          });
          recordsInserted++;
        }
      }

      cellsProcessed++;

      // Rate limiting - Tomorrow.io has rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
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
 * Get weather alerts for a location
 */
export async function getWeatherAlerts(lat: number, lng: number): Promise<any[]> {
  if (!TOMORROW_IO_API_KEY) {
    return [];
  }

  try {
    const current = await fetchCurrentWeather(lat, lng);
    const alerts: any[] = [];

    // Check for extreme conditions
    if (current.data?.values) {
      const values = current.data.values;

      // Fire danger
      if (values.fireIndex && values.fireIndex > 50) {
        alerts.push({
          type: "fire_danger",
          severity: values.fireIndex > 100 ? "critical" : "high",
          message: `Fire Weather Index: ${values.fireIndex}`,
          value: values.fireIndex,
        });
      }

      // Extreme heat
      if (values.temperature && values.temperature > 40) {
        alerts.push({
          type: "heatwave",
          severity: values.temperature > 45 ? "critical" : "high",
          message: `Extreme temperature: ${values.temperature}°C`,
          value: values.temperature,
        });
      }

      // Frost
      if (values.temperature && values.temperature < 2) {
        alerts.push({
          type: "frost",
          severity: values.temperature < 0 ? "high" : "medium",
          message: `Frost risk: ${values.temperature}°C`,
          value: values.temperature,
        });
      }

      // High winds
      if (values.windSpeed && values.windSpeed > 60) {
        alerts.push({
          type: "wind",
          severity: values.windSpeed > 90 ? "critical" : "high",
          message: `High winds: ${values.windSpeed} km/h`,
          value: values.windSpeed,
        });
      }

      // Heavy rain
      if (values.precipitationIntensity && values.precipitationIntensity > 10) {
        alerts.push({
          type: "flood",
          severity: values.precipitationIntensity > 30 ? "critical" : "high",
          message: `Heavy rainfall: ${values.precipitationIntensity} mm/hr`,
          value: values.precipitationIntensity,
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
 * Check if Tomorrow.io API is configured and working
 */
export async function checkWeatherApiStatus(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
}> {
  if (!TOMORROW_IO_API_KEY) {
    return { configured: false, working: false, error: "API key not configured" };
  }

  try {
    // Test with Sydney coordinates
    await fetchCurrentWeather(-33.8688, 151.2093);
    return { configured: true, working: true };
  } catch (error) {
    return {
      configured: true,
      working: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
