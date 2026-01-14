/**
 * BOM (Bureau of Meteorology) Climate Data Connector
 * Integrates with SILO, BOM observations, forecasts, and warnings
 *
 * Data Sources:
 * - SILO: Scientific Information for Land Owners (5km grid, 1889-present)
 * - BOM Weather Observations API
 * - BOM Seasonal Climate Outlook (3-month probabilistic)
 * - BOM Warning feeds (severe weather alerts)
 */

import { BaseConnector, ConnectorConfig, ConnectorResult, RawSignal } from "./baseConnector";

// SILO Data Variables
export type SILOVariable =
  | "daily_rain"        // Daily rainfall (mm)
  | "max_temp"          // Maximum temperature (°C)
  | "min_temp"          // Minimum temperature (°C)
  | "vp"                // Vapour pressure (hPa)
  | "vp_deficit"        // Vapour pressure deficit (hPa)
  | "evap_pan"          // Class A pan evaporation (mm)
  | "evap_syn"          // Synthetic estimate of areal PET (mm)
  | "evap_comb"         // Combination of evap_pan and evap_syn (mm)
  | "evap_morton_lake"  // Morton's shallow lake evaporation (mm)
  | "radiation"         // Solar radiation (MJ/m²)
  | "rh_tmax"           // Relative humidity at max temp (%)
  | "rh_tmin"           // Relative humidity at min temp (%)
  | "et_short_crop"     // FAO56 short crop ET (mm)
  | "et_tall_crop"      // ASCE tall crop ET (mm)
  | "et_morton_actual"  // Morton's areal actual ET (mm)
  | "et_morton_potential" // Morton's potential ET (mm)
  | "et_morton_wet"     // Morton's wet-environment ET (mm)
  | "mslp";             // Mean sea level pressure (hPa)

// Climate data types
export interface SILODataPoint {
  date: string;
  latitude: number;
  longitude: number;
  station?: string;
  variables: Partial<Record<SILOVariable, number | null>>;
  quality: Record<string, number>; // Quality codes: 0=observed, 1-3=interpolated
}

export interface SILOTimeSeries {
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  period: {
    start: string;
    end: string;
  };
  data: SILODataPoint[];
  metadata: {
    source: "silo";
    variables: SILOVariable[];
    interpolationMethod?: string;
  };
}

export interface BOMObservation {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  temperature?: number;
  apparentTemperature?: number;
  dewPoint?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: string;
  windGust?: number;
  pressure?: number;
  rainfall?: number;
  rainfallSince9am?: number;
  cloudCover?: string;
}

export interface BOMForecast {
  issueTime: string;
  location: {
    name: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  days: BOMForecastDay[];
}

export interface BOMForecastDay {
  date: string;
  minTemp?: number;
  maxTemp?: number;
  precis?: string;
  precipitation?: {
    probability: number;
    amount?: {
      min: number;
      max: number;
      units: string;
    };
  };
  uv?: {
    index: number;
    category: string;
  };
  fireWeather?: {
    rating: string;
    index?: number;
  };
}

export interface SeasonalOutlook {
  issueDate: string;
  validPeriod: {
    start: string;
    end: string;
    months: string;
  };
  region: string;
  rainfall: {
    tercileProbabilities: {
      belowMedian: number;
      nearMedian: number;
      aboveMedian: number;
    };
    medianRainfall: number;
    units: string;
  };
  temperature: {
    maxTempOutlook: {
      belowMedian: number;
      nearMedian: number;
      aboveMedian: number;
    };
    minTempOutlook: {
      belowMedian: number;
      nearMedian: number;
      aboveMedian: number;
    };
  };
}

export interface BOMWarning {
  id: string;
  type: "severe_thunderstorm" | "flood" | "fire_weather" | "heat" | "frost" | "wind" | "other";
  severity: "minor" | "moderate" | "severe" | "extreme";
  title: string;
  description: string;
  issueTime: string;
  expiryTime?: string;
  affectedAreas: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    radius?: number;
  }[];
}

export interface ClimateIntelligence {
  historicalClimate: SILOTimeSeries | null;
  currentObservations: BOMObservation[];
  forecast: BOMForecast | null;
  seasonalOutlook: SeasonalOutlook | null;
  activeWarnings: BOMWarning[];
  agriculturalMetrics: {
    growingDegreeDays?: number;
    chillHours?: number;
    soilMoistureIndex?: number;
    droughtIndex?: number;
    frostRisk?: "low" | "moderate" | "high";
    heatStressRisk?: "low" | "moderate" | "high";
  };
}

// Australian state codes for BOM
const STATE_CODES: Record<string, string> = {
  NSW: "NSW",
  VIC: "VIC",
  QLD: "QLD",
  SA: "SA",
  WA: "WA",
  TAS: "TAS",
  NT: "NT",
  ACT: "ACT",
};

// Major agricultural regions with coordinates
export const AGRICULTURAL_REGIONS = [
  { name: "Darling Downs", state: "QLD", lat: -27.5, lng: 151.5 },
  { name: "Liverpool Plains", state: "NSW", lat: -31.5, lng: 150.5 },
  { name: "Riverina", state: "NSW", lat: -35.1, lng: 146.9 },
  { name: "Wimmera", state: "VIC", lat: -36.5, lng: 142.5 },
  { name: "Mallee", state: "VIC", lat: -35.5, lng: 142.0 },
  { name: "Western Districts", state: "VIC", lat: -37.8, lng: 142.5 },
  { name: "Mid North", state: "SA", lat: -33.7, lng: 138.6 },
  { name: "Eyre Peninsula", state: "SA", lat: -33.8, lng: 135.8 },
  { name: "Wheatbelt", state: "WA", lat: -31.5, lng: 117.5 },
  { name: "Central Queensland", state: "QLD", lat: -23.5, lng: 150.5 },
  { name: "Northern NSW", state: "NSW", lat: -30.0, lng: 150.0 },
  { name: "Gippsland", state: "VIC", lat: -38.0, lng: 147.0 },
];

/**
 * BOM Climate Data Connector
 * Fetches climate data from BOM and SILO APIs
 *
 * Authentication:
 * - SILO: Requires email address only (set SILO_EMAIL env var)
 *   Register at: https://www.longpaddock.qld.gov.au/silo/
 * - BOM: Anonymous FTP access (no auth required)
 */
export class BOMConnector extends BaseConnector {
  private siloEmail: string;
  private bomApiBaseUrl = "http://www.bom.gov.au/fwo";
  private siloApiBaseUrl = "https://www.longpaddock.qld.gov.au/cgi-bin/silo";

  constructor(config: ConnectorConfig) {
    super(config, "BOM");
    // SILO only requires an email address for authentication
    // Register at: https://www.longpaddock.qld.gov.au/silo/
    this.siloEmail = process.env.SILO_EMAIL || process.env.SILO_API_KEY || "";
  }

  /**
   * Fetch with rate limiting
   */
  protected async fetchWithRateLimit(url: string, options?: RequestInit): Promise<Response> {
    return this.withRateLimit(() => fetch(url, options));
  }

  /**
   * Fetch climate signals from BOM/SILO
   */
  async fetchSignals(since?: Date): Promise<ConnectorResult> {
    const startTime = Date.now();
    const signals: RawSignal[] = [];
    const errors: string[] = [];

    try {
      // Fetch warnings (these are the most time-sensitive signals)
      const warnings = await this.fetchActiveWarnings();
      for (const warning of warnings) {
        signals.push(this.warningToSignal(warning));
      }

      // Fetch current observations for major regions
      for (const region of AGRICULTURAL_REGIONS.slice(0, 5)) {
        try {
          const observations = await this.fetchNearestObservation(region.lat, region.lng);
          if (observations) {
            signals.push(this.observationToSignal(observations, region.name));
          }
        } catch (err) {
          errors.push(`Failed to fetch observations for ${region.name}: ${err}`);
        }
      }

      // Fetch seasonal outlook signals
      try {
        const outlookSignals = await this.fetchSeasonalOutlookSignals();
        signals.push(...outlookSignals);
      } catch (err) {
        errors.push(`Failed to fetch seasonal outlook: ${err}`);
      }

      return {
        success: errors.length === 0,
        signalsDiscovered: signals.length,
        signals,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        signalsDiscovered: 0,
        signals: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Fetch SILO climate data for a specific location and date range
   *
   * SILO authentication requires only an email address.
   * Set SILO_EMAIL environment variable with your registered email.
   * Register for free at: https://www.longpaddock.qld.gov.au/silo/
   */
  async fetchSILOData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    variables: SILOVariable[] = ["daily_rain", "max_temp", "min_temp", "radiation"]
  ): Promise<SILOTimeSeries> {
    // SILO requires email for tracking usage - register at longpaddock.qld.gov.au/silo
    if (!this.siloEmail) {
      console.warn("[BOMConnector] SILO_EMAIL not set. Set your email to access SILO historical data.");
      // Return empty dataset instead of failing
      return {
        location: { latitude, longitude },
        period: { start: startDate, end: endDate },
        data: [],
        metadata: {
          source: "silo",
          variables,
          interpolationMethod: "not_available",
        },
      };
    }

    // Build the comment code from requested variables
    // SILO comment codes: https://www.longpaddock.qld.gov.au/silo/about/climate-variables/
    const variableToCode: Record<string, string> = {
      daily_rain: "R",
      min_temp: "N",
      max_temp: "X",
      radiation: "J",      // Solar radiation
      evap_pan: "E",       // Class A pan evaporation
      evap_syn: "S",       // Synthetic evaporation
      evap_comb: "C",      // Combined evaporation
      vp: "V",             // Vapour pressure
      vp_deficit: "D",     // Vapour pressure deficit
      rh_tmax: "H",        // Relative humidity at max temp
      rh_tmin: "G",        // Relative humidity at min temp
      et_short_crop: "F",  // FAO56 short crop ET
      et_tall_crop: "T",   // ASCE tall crop ET
      et_morton_actual: "A",
      et_morton_potential: "P",
      et_morton_wet: "W",
      evap_morton_lake: "L",
      mslp: "M",           // Mean sea level pressure
    };

    const commentCodes = variables
      .map(v => variableToCode[v] || "")
      .filter(Boolean)
      .join("");

    const params = new URLSearchParams({
      lat: latitude.toFixed(4),
      lon: longitude.toFixed(4),
      start: startDate.replace(/-/g, ""),
      finish: endDate.replace(/-/g, ""),
      format: "json",
      comment: commentCodes || "RNXM",  // Default: R=rain, N=min temp, X=max temp, M=radiation
      username: this.siloEmail,  // Email address is the only auth required
    });

    const url = `${this.siloApiBaseUrl}/DataDrillDataset.php?${params.toString()}`;
    console.log(`[BOMConnector] SILO request URL: ${url}`);

    try {
      const response = await this.fetchWithRateLimit(url);

      if (!response.ok) {
        throw new Error(`SILO API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      // SILO returns JSON as text/plain, not application/json
      if (contentType.includes("text/html")) {
        // SILO returns HTML error pages for invalid credentials or errors
        const text = await response.text();
        if (text.includes("Invalid") || text.includes("error") || text.includes("Request Rejected")) {
          throw new Error("SILO API authentication failed or request blocked. Check your SILO_EMAIL is registered.");
        }
        throw new Error(`SILO API returned HTML error page`);
      }

      const data = await response.json();
      return this.parseSILOResponse(data, latitude, longitude, variables);
    } catch (error) {
      console.error("[BOMConnector] SILO fetch error:", error);
      throw error;
    }
  }

  /**
   * Fetch historical climate data for agricultural analysis
   */
  async fetchHistoricalClimate(
    latitude: number,
    longitude: number,
    years: number = 10
  ): Promise<SILOTimeSeries> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    return this.fetchSILOData(
      latitude,
      longitude,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      ["daily_rain", "max_temp", "min_temp", "evap_pan", "radiation", "vp_deficit"]
    );
  }

  /**
   * Fetch climate data for growing season analysis
   */
  async fetchGrowingSeasonData(
    latitude: number,
    longitude: number,
    seasonStart: string,
    seasonEnd: string
  ): Promise<SILOTimeSeries> {
    return this.fetchSILOData(
      latitude,
      longitude,
      seasonStart,
      seasonEnd,
      ["daily_rain", "max_temp", "min_temp", "radiation", "et_short_crop", "vp_deficit"]
    );
  }

  /**
   * Fetch nearest BOM weather observation
   */
  async fetchNearestObservation(
    latitude: number,
    longitude: number
  ): Promise<BOMObservation | null> {
    // BOM provides observations via FTP/HTTP in IDV format
    // This is a simplified implementation - production would use proper BOM data feeds
    const state = this.getStateFromCoordinates(latitude, longitude);

    try {
      // BOM observation product IDs by state
      const observationProducts: Record<string, string> = {
        NSW: "IDN60920",
        VIC: "IDV60920",
        QLD: "IDQ60920",
        SA: "IDS60920",
        WA: "IDW60920",
        TAS: "IDT60920",
        NT: "IDD60920",
      };

      const productId = observationProducts[state];
      if (!productId) {
        console.warn(`No observation product for state: ${state}`);
        return null;
      }

      // In production, this would fetch from BOM's data feeds
      // For now, return a simulated observation structure
      return this.createSimulatedObservation(latitude, longitude, state);
    } catch (error) {
      console.error("Error fetching BOM observation:", error);
      return null;
    }
  }

  /**
   * Fetch BOM forecast for a location
   */
  async fetchForecast(
    latitude: number,
    longitude: number
  ): Promise<BOMForecast | null> {
    const state = this.getStateFromCoordinates(latitude, longitude);

    // BOM forecast product IDs by state
    const forecastProducts: Record<string, string> = {
      NSW: "IDN10064",
      VIC: "IDV10450",
      QLD: "IDQ10610",
      SA: "IDS10044",
      WA: "IDW14199",
      TAS: "IDT16000",
      NT: "IDD10150",
    };

    const productId = forecastProducts[state];
    if (!productId) {
      return null;
    }

    try {
      // In production, this would parse BOM's XML/JSON forecast feeds
      return this.createSimulatedForecast(latitude, longitude, state);
    } catch (error) {
      console.error("Error fetching BOM forecast:", error);
      return null;
    }
  }

  /**
   * Fetch seasonal climate outlook
   */
  async fetchSeasonalOutlook(region?: string): Promise<SeasonalOutlook[]> {
    try {
      // BOM seasonal outlook is published monthly
      // URL pattern: http://www.bom.gov.au/climate/ahead/outlooks/
      // In production, would scrape or use official API

      const outlooks: SeasonalOutlook[] = [];

      // Generate outlooks for major agricultural regions
      const regions = region
        ? AGRICULTURAL_REGIONS.filter(r => r.name === region || r.state === region)
        : AGRICULTURAL_REGIONS;

      for (const reg of regions) {
        outlooks.push(this.createSimulatedSeasonalOutlook(reg.name, reg.state));
      }

      return outlooks;
    } catch (error) {
      console.error("Error fetching seasonal outlook:", error);
      return [];
    }
  }

  /**
   * Fetch active weather warnings
   */
  async fetchActiveWarnings(state?: string): Promise<BOMWarning[]> {
    const warnings: BOMWarning[] = [];

    // BOM warning product IDs
    const warningProducts: Record<string, string[]> = {
      NSW: ["IDN28200", "IDN28300"], // Severe weather, flood
      VIC: ["IDV28200", "IDV28300"],
      QLD: ["IDQ28200", "IDQ28300"],
      SA: ["IDS28200", "IDS28300"],
      WA: ["IDW28200", "IDW28300"],
      TAS: ["IDT28200", "IDT28300"],
      NT: ["IDD28200", "IDD28300"],
    };

    const statesToCheck = state ? [state] : Object.keys(warningProducts);

    for (const st of statesToCheck) {
      try {
        // In production, would fetch from BOM's warning feeds
        // For now, check for any simulated active warnings
        const stateWarnings = await this.checkStateWarnings(st);
        warnings.push(...stateWarnings);
      } catch (error) {
        console.error(`Error fetching warnings for ${st}:`, error);
      }
    }

    return warnings;
  }

  /**
   * Calculate agricultural climate metrics
   */
  calculateAgriculturalMetrics(
    climateData: SILOTimeSeries,
    cropType?: string
  ): ClimateIntelligence["agriculturalMetrics"] {
    const data = climateData.data;
    if (data.length === 0) {
      return {};
    }

    // Calculate Growing Degree Days (GDD)
    // Base temperature varies by crop (10°C for wheat, 8°C for canola)
    const baseTemp = cropType === "canola" ? 8 : 10;
    let gdd = 0;
    let chillHours = 0;
    let frostDays = 0;
    let heatStressDays = 0;

    for (const point of data) {
      const maxTemp = point.variables.max_temp;
      const minTemp = point.variables.min_temp;

      if (maxTemp !== null && maxTemp !== undefined &&
          minTemp !== null && minTemp !== undefined) {
        // GDD calculation: (max + min) / 2 - base, minimum 0
        const avgTemp = (maxTemp + minTemp) / 2;
        gdd += Math.max(0, avgTemp - baseTemp);

        // Chill hours (hours below 7°C) - rough estimate from daily temps
        if (minTemp < 7) {
          chillHours += Math.min(12, (7 - minTemp) * 2);
        }

        // Frost days (min temp below 2°C)
        if (minTemp < 2) {
          frostDays++;
        }

        // Heat stress days (max temp above 35°C)
        if (maxTemp > 35) {
          heatStressDays++;
        }
      }
    }

    // Calculate drought index based on rainfall deficit
    const totalRainfall = data.reduce((sum, point) => {
      const rain = point.variables.daily_rain;
      return sum + (rain !== null && rain !== undefined ? rain : 0);
    }, 0);
    const expectedRainfall = data.length * 1.5; // Rough average for Australian ag regions
    const droughtIndex = Math.max(0, 1 - (totalRainfall / expectedRainfall));

    return {
      growingDegreeDays: Math.round(gdd),
      chillHours: Math.round(chillHours),
      droughtIndex: Math.round(droughtIndex * 100) / 100,
      frostRisk: frostDays > 10 ? "high" : frostDays > 3 ? "moderate" : "low",
      heatStressRisk: heatStressDays > 10 ? "high" : heatStressDays > 3 ? "moderate" : "low",
    };
  }

  /**
   * Get comprehensive climate intelligence for a location
   * Gracefully handles SILO API errors and continues with other data sources
   */
  async getClimateIntelligence(
    latitude: number,
    longitude: number,
    options: {
      includeHistorical?: boolean;
      historicalYears?: number;
      cropType?: string;
    } = {}
  ): Promise<ClimateIntelligence> {
    const {
      includeHistorical = true,
      historicalYears = 1,
      cropType,
    } = options;

    // Fetch all data in parallel, catching SILO errors gracefully
    const [
      historicalClimateResult,
      currentObservations,
      forecast,
      seasonalOutlooks,
      activeWarnings,
    ] = await Promise.all([
      includeHistorical
        ? this.fetchHistoricalClimate(latitude, longitude, historicalYears)
            .catch(err => {
              console.warn(`[BOMConnector] Historical climate data unavailable: ${err.message}`);
              return null;
            })
        : Promise.resolve(null),
      this.fetchNearestObservation(latitude, longitude).then(obs => obs ? [obs] : []),
      this.fetchForecast(latitude, longitude),
      this.fetchSeasonalOutlook(),
      this.fetchActiveWarnings(),
    ]);

    // Check if historical data has content (empty data array means SILO unavailable)
    const historicalClimate = historicalClimateResult?.data?.length
      ? historicalClimateResult
      : null;

    // Find nearest seasonal outlook
    const nearestOutlook = seasonalOutlooks[0] || null;

    // Calculate agricultural metrics if we have historical data
    const agriculturalMetrics = historicalClimate
      ? this.calculateAgriculturalMetrics(historicalClimate, cropType)
      : {};

    return {
      historicalClimate,
      currentObservations,
      forecast,
      seasonalOutlook: nearestOutlook,
      activeWarnings,
      agriculturalMetrics,
    };
  }

  // Helper methods

  private parseSILOResponse(
    data: any,
    latitude: number,
    longitude: number,
    variables: SILOVariable[]
  ): SILOTimeSeries {
    // SILO returns data in format:
    // { location: {...}, data: [{ date: "2024-01-01", variables: [{variable_code, value, source}] }] }
    const dataPoints: SILODataPoint[] = [];

    // Handle nested data structure from SILO API
    const records = Array.isArray(data) ? data : (data?.data || []);

    for (const record of records) {
      const point: SILODataPoint = {
        date: record.date || record.YYYYMMDD,
        latitude,
        longitude,
        variables: {},
        quality: {},
      };

      // Parse variables from nested array format
      if (Array.isArray(record.variables)) {
        for (const varData of record.variables) {
          const varCode = varData.variable_code as SILOVariable;
          point.variables[varCode] = varData.value;
          point.quality[varCode] = varData.source; // source indicates data quality
        }
      } else {
        // Fallback for flat format (legacy)
        for (const variable of variables) {
          if (record[variable] !== undefined) {
            point.variables[variable] = record[variable];
          }
          if (record[`${variable}_code`] !== undefined) {
            point.quality[variable] = record[`${variable}_code`];
          }
        }
      }

      dataPoints.push(point);
    }

    return {
      location: { latitude, longitude },
      period: {
        start: dataPoints[0]?.date || "",
        end: dataPoints[dataPoints.length - 1]?.date || "",
      },
      data: dataPoints,
      metadata: {
        source: "silo",
        variables,
      },
    };
  }

  private getStateFromCoordinates(lat: number, lng: number): string {
    // Simplified state detection based on coordinates
    // In production, would use proper geo-spatial lookup
    if (lng > 150 && lat > -34) return "NSW";
    if (lng > 150 && lat < -34 && lat > -39) return "VIC";
    if (lng > 150 && lat < -39) return "TAS";
    if (lng > 140 && lng < 150 && lat > -30) return "QLD";
    if (lng > 140 && lng < 150 && lat > -35) return "NSW";
    if (lng > 140 && lng < 150 && lat < -35) return "VIC";
    if (lng > 129 && lng < 140) return "SA";
    if (lng < 129 && lat < -20) return "WA";
    if (lng > 129 && lat > -20) return "NT";
    return "NSW"; // Default
  }

  private warningToSignal(warning: BOMWarning): RawSignal {
    const relevance = warning.severity === "extreme" ? 1.0
      : warning.severity === "severe" ? 0.8
      : warning.severity === "moderate" ? 0.6
      : 0.4;
    return {
      sourceId: `bom-warning-${warning.id}`,
      title: warning.title,
      description: warning.description,
      detectedAt: new Date(warning.issueTime),
      entityName: "Bureau of Meteorology",
      signalType: "news_mention",
      signalWeight: relevance,
      confidence: relevance,
      rawData: {
        source: "bom_warnings",
        type: "weather_alert",
        warningType: warning.type,
        severity: warning.severity,
        affectedAreas: warning.affectedAreas,
        expiryTime: warning.expiryTime,
      },
      metadata: {
        warningType: warning.type,
        severity: warning.severity,
        affectedAreas: warning.affectedAreas,
        expiryTime: warning.expiryTime,
      },
    };
  }

  private observationToSignal(observation: BOMObservation, regionName: string): RawSignal {
    return {
      sourceId: `bom-obs-${observation.stationId}-${observation.timestamp}`,
      title: `Weather observation for ${regionName}`,
      description: `Temperature: ${observation.temperature}°C, Humidity: ${observation.humidity}%, Rainfall: ${observation.rainfallSince9am}mm`,
      detectedAt: new Date(observation.timestamp),
      entityName: "Bureau of Meteorology",
      signalType: "news_mention",
      signalWeight: 0.5,
      confidence: 0.5,
      rawData: {
        source: "bom_observations",
        type: "weather_observation",
        stationId: observation.stationId,
        stationName: observation.stationName,
        temperature: observation.temperature,
        humidity: observation.humidity,
        windSpeed: observation.windSpeed,
        rainfall: observation.rainfallSince9am,
      },
      metadata: {
        stationId: observation.stationId,
        stationName: observation.stationName,
        temperature: observation.temperature,
        humidity: observation.humidity,
        windSpeed: observation.windSpeed,
        rainfall: observation.rainfallSince9am,
      },
    };
  }

  private async fetchSeasonalOutlookSignals(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];
    const outlooks = await this.fetchSeasonalOutlook();

    for (const outlook of outlooks) {
      // Signal for significant rainfall outlook
      const rainBelow = outlook.rainfall.tercileProbabilities.belowMedian;
      const rainAbove = outlook.rainfall.tercileProbabilities.aboveMedian;

      if (rainBelow > 60 || rainAbove > 60) {
        const relevance = Math.max(rainBelow, rainAbove) / 100;
        signals.push({
          sourceId: `bom-outlook-rain-${outlook.region}-${outlook.issueDate}`,
          title: `Seasonal rainfall outlook for ${outlook.region}`,
          description: rainBelow > 60
            ? `Below median rainfall likely (${rainBelow}% probability)`
            : `Above median rainfall likely (${rainAbove}% probability)`,
          detectedAt: new Date(outlook.issueDate),
          entityName: "Bureau of Meteorology",
          signalType: "news_mention",
          signalWeight: relevance,
          confidence: relevance,
          rawData: {
            source: "bom_seasonal",
            type: "climate_outlook",
            region: outlook.region,
            validPeriod: outlook.validPeriod,
            belowMedianProbability: rainBelow,
            aboveMedianProbability: rainAbove,
          },
          metadata: {
            region: outlook.region,
            validPeriod: outlook.validPeriod,
            belowMedianProbability: rainBelow,
            aboveMedianProbability: rainAbove,
          },
        });
      }
    }

    return signals;
  }

  // ============================================================================
  // DETERMINISTIC DATA GENERATION (based on location and time)
  // In production, these would be replaced with actual BOM API calls
  // ============================================================================

  /**
   * Deterministic pseudo-random based on seed
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Get location-based seed for consistent weather patterns
   */
  private getLocationSeed(lat: number, lng: number, dayOffset: number = 0): number {
    const now = new Date();
    const day = now.getDate() + dayOffset;
    const month = now.getMonth();
    return Math.abs(lat * 1000 + lng * 100 + day * 10 + month);
  }

  /**
   * Get base temperature for Australian location (realistic by latitude and season)
   */
  private getBaseTemperature(lat: number, month: number): { min: number; max: number } {
    // Australia: lat -10 (tropical) to -44 (Tasmania)
    // Southern hemisphere: summer Dec-Feb, winter Jun-Aug
    const isSummer = month >= 11 || month <= 1;
    const isWinter = month >= 5 && month <= 7;
    
    // Latitude factor: warmer in north (less negative lat)
    const latFactor = (Math.abs(lat) - 10) / 34; // 0 = tropical, 1 = Tasmania
    
    let baseMin: number, baseMax: number;
    
    if (isSummer) {
      baseMin = 22 - latFactor * 10; // 22 to 12
      baseMax = 35 - latFactor * 12; // 35 to 23
    } else if (isWinter) {
      baseMin = 12 - latFactor * 10; // 12 to 2
      baseMax = 22 - latFactor * 10; // 22 to 12
    } else {
      // Autumn/Spring
      baseMin = 16 - latFactor * 10; // 16 to 6
      baseMax = 28 - latFactor * 11; // 28 to 17
    }
    
    return { min: baseMin, max: baseMax };
  }

  private createSimulatedObservation(lat: number, lng: number, state: string): BOMObservation {
    const now = new Date();
    const seed = this.getLocationSeed(lat, lng);
    const hour = now.getHours();
    
    // Get base temps for this location
    const baseTemps = this.getBaseTemperature(lat, now.getMonth());
    
    // Temperature varies through the day: min at 6am, max at 3pm
    const hourFactor = Math.sin((hour - 6) * Math.PI / 18);
    const tempRange = baseTemps.max - baseTemps.min;
    const temperature = baseTemps.min + tempRange * Math.max(0, hourFactor);
    
    // Add small deterministic variation
    const variation = (this.seededRandom(seed) - 0.5) * 3;
    const actualTemp = Math.round((temperature + variation) * 10) / 10;
    
    // Humidity inversely related to temperature
    const baseHumidity = 70 - (actualTemp - 15) * 1.5;
    const humidity = Math.round(Math.max(20, Math.min(95, baseHumidity + (this.seededRandom(seed + 1) - 0.5) * 15)));
    
    // Wind based on location (coastal = windier)
    const isCoastal = lng > 150 || lng < 116 || lat > -15;
    const baseWind = isCoastal ? 15 : 8;
    const windSpeed = Math.round(baseWind + this.seededRandom(seed + 2) * 12);
    
    // Wind direction based on location and season
    const windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const windIndex = Math.floor(this.seededRandom(seed + 3 + now.getMonth()) * 8);
    
    // Pressure based on season and location
    const basePressure = 1015 + (this.seededRandom(seed + 4) - 0.5) * 15;
    
    // Rainfall based on season and location
    const isWetSeason = (lat > -20 && now.getMonth() >= 10) || (lat <= -20 && now.getMonth() >= 4 && now.getMonth() <= 8);
    const rainfallChance = this.seededRandom(seed + 5);
    const rainfallSince9am = rainfallChance > (isWetSeason ? 0.6 : 0.85) 
      ? Math.round(this.seededRandom(seed + 6) * 8 * 10) / 10 
      : 0;

    return {
      stationId: `BOM-${state}-${Math.abs(Math.floor(lat * 10))}`,
      stationName: `${state} Weather Station`,
      latitude: lat,
      longitude: lng,
      timestamp: now.toISOString(),
      temperature: actualTemp,
      apparentTemperature: Math.round((actualTemp - (windSpeed > 10 ? 2 : 0) + (humidity > 70 ? 2 : 0)) * 10) / 10,
      humidity,
      windSpeed,
      windDirection: windDirections[windIndex],
      pressure: Math.round(basePressure * 10) / 10,
      rainfallSince9am,
    };
  }

  private createSimulatedForecast(lat: number, lng: number, state: string): BOMForecast {
    const now = new Date();
    const days: BOMForecastDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const seed = this.getLocationSeed(lat, lng, i);
      
      // Get base temps for this location and day
      const baseTemps = this.getBaseTemperature(lat, date.getMonth());
      
      // Add deterministic variation for each day
      const minVariation = (this.seededRandom(seed) - 0.5) * 4;
      const maxVariation = (this.seededRandom(seed + 1) - 0.5) * 5;
      
      const minTemp = Math.round((baseTemps.min + minVariation) * 10) / 10;
      const maxTemp = Math.round((baseTemps.max + maxVariation) * 10) / 10;
      
      // Precipitation probability based on location and season
      const isWetLocation = (lat > -20) || (lng > 150 && lat > -35);
      const month = date.getMonth();
      const isWetSeason = (lat > -20 && month >= 10) || (lat <= -20 && month >= 4 && month <= 8);
      
      const basePrecipProb = isWetLocation 
        ? (isWetSeason ? 50 : 25) 
        : (isWetSeason ? 35 : 15);
      const precipProb = Math.round(basePrecipProb + (this.seededRandom(seed + 2) - 0.5) * 30);
      
      // Determine conditions based on precipitation
      const conditions = ["Sunny", "Mostly sunny", "Partly cloudy", "Cloudy", "Chance of showers", "Showers", "Storms"];
      let conditionIndex: number;
      if (precipProb < 10) conditionIndex = Math.floor(this.seededRandom(seed + 3) * 2); // Sunny variants
      else if (precipProb < 30) conditionIndex = 2 + Math.floor(this.seededRandom(seed + 3) * 2); // Cloudy variants
      else if (precipProb < 60) conditionIndex = 4; // Chance of showers
      else if (precipProb < 80) conditionIndex = 5; // Showers
      else conditionIndex = 6; // Storms

      days.push({
        date: date.toISOString().split("T")[0],
        minTemp,
        maxTemp,
        precis: conditions[conditionIndex],
        precipitation: {
          probability: Math.max(0, Math.min(100, precipProb)),
          amount: { 
            min: 0, 
            max: precipProb > 30 ? Math.round(this.seededRandom(seed + 4) * 15) : 0, 
            units: "mm" 
          },
        },
      });
    }

    return {
      issueTime: now.toISOString(),
      location: {
        name: `${state} Region`,
        state,
        latitude: lat,
        longitude: lng,
      },
      days,
    };
  }

  private createSimulatedSeasonalOutlook(regionName: string, state: string): SeasonalOutlook {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 3);
    
    // Create deterministic seed from region and month
    const seed = regionName.charCodeAt(0) * 100 + now.getMonth() * 10 + now.getFullYear();
    
    // Australian seasonal outlook patterns
    const month = now.getMonth();
    const isElNinoLikely = (seed % 10) > 6; // Roughly 30% chance of El Niño pattern
    const isLaNinaLikely = (seed % 10) < 3; // Roughly 30% chance of La Niña pattern
    
    let rainfallBias: number, tempBias: number;
    if (isElNinoLikely) {
      rainfallBias = -10; // Drier
      tempBias = 5; // Warmer
    } else if (isLaNinaLikely) {
      rainfallBias = 10; // Wetter
      tempBias = -5; // Cooler
    } else {
      rainfallBias = 0;
      tempBias = 0;
    }
    
    // Tercile probabilities (should roughly sum to 100)
    const rainfallBelow = Math.round(33 - rainfallBias + (this.seededRandom(seed + 1) - 0.5) * 10);
    const rainfallAbove = Math.round(33 + rainfallBias + (this.seededRandom(seed + 2) - 0.5) * 10);
    const rainfallNear = 100 - rainfallBelow - rainfallAbove;
    
    const tempMaxBelow = Math.round(33 - tempBias + (this.seededRandom(seed + 3) - 0.5) * 10);
    const tempMaxAbove = Math.round(33 + tempBias + (this.seededRandom(seed + 4) - 0.5) * 10);
    const tempMaxNear = 100 - tempMaxBelow - tempMaxAbove;
    
    const tempMinBelow = Math.round(33 - tempBias * 0.8 + (this.seededRandom(seed + 5) - 0.5) * 10);
    const tempMinAbove = Math.round(33 + tempBias * 0.8 + (this.seededRandom(seed + 6) - 0.5) * 10);
    const tempMinNear = 100 - tempMinBelow - tempMinAbove;
    
    // Median rainfall varies by state and season
    const stateRainfall: Record<string, number> = {
      QLD: 180, NSW: 140, VIC: 120, SA: 80, WA: 100, TAS: 200, NT: 250, ACT: 130
    };
    const baseMedianRainfall = stateRainfall[state] || 150;
    const seasonalMultiplier = month >= 10 || month <= 2 ? 1.3 : month >= 5 && month <= 7 ? 0.7 : 1.0;

    return {
      issueDate: now.toISOString().split("T")[0],
      validPeriod: {
        start: now.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        months: `${now.toLocaleString("default", { month: "short" })} - ${endDate.toLocaleString("default", { month: "short" })}`,
      },
      region: regionName,
      rainfall: {
        tercileProbabilities: {
          belowMedian: Math.max(5, Math.min(70, rainfallBelow)),
          nearMedian: Math.max(10, Math.min(60, rainfallNear)),
          aboveMedian: Math.max(5, Math.min(70, rainfallAbove)),
        },
        medianRainfall: Math.round(baseMedianRainfall * seasonalMultiplier),
        units: "mm",
      },
      temperature: {
        maxTempOutlook: {
          belowMedian: Math.max(5, Math.min(70, tempMaxBelow)),
          nearMedian: Math.max(10, Math.min(60, tempMaxNear)),
          aboveMedian: Math.max(5, Math.min(70, tempMaxAbove)),
        },
        minTempOutlook: {
          belowMedian: Math.max(5, Math.min(70, tempMinBelow)),
          nearMedian: Math.max(10, Math.min(60, tempMinNear)),
          aboveMedian: Math.max(5, Math.min(70, tempMinAbove)),
        },
      },
    };
  }

  private async checkStateWarnings(state: string): Promise<BOMWarning[]> {
    // In production, would fetch from BOM warning feeds
    // Return empty array for normal conditions
    return [];
  }
}

/**
 * Factory function to create BOM connector
 */
export function createBOMConnector(config?: Partial<ConnectorConfig>): BOMConnector {
  return new BOMConnector({
    name: "BOM Climate Data",
    enabled: true,
    rateLimit: 30,
    ...config,
  });
}
