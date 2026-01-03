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
        errors: errors.length > 0 ? errors : undefined,
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

    const params = new URLSearchParams({
      lat: latitude.toFixed(4),
      lon: longitude.toFixed(4),
      start: startDate.replace(/-/g, ""),
      finish: endDate.replace(/-/g, ""),
      format: "json",
      username: this.siloEmail,  // Email address is the username
      password: "apirequest",    // Required password for grid/DataDrill API
    });

    // Add requested climate variables
    for (const v of variables) {
      params.append("variable", v);
    }

    try {
      const response = await this.fetchWithRateLimit(
        `${this.siloApiBaseUrl}/DataDrillDataset.php?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`SILO API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // SILO returns HTML error pages for invalid credentials
        const text = await response.text();
        if (text.includes("Invalid") || text.includes("error")) {
          throw new Error("SILO API authentication failed. Check your SILO_EMAIL is registered.");
        }
        throw new Error(`SILO API returned non-JSON response: ${contentType}`);
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
    // SILO returns data in a specific JSON format
    // This parses it into our standardized structure
    const dataPoints: SILODataPoint[] = [];

    if (Array.isArray(data)) {
      for (const record of data) {
        const point: SILODataPoint = {
          date: record.date || record.YYYYMMDD,
          latitude,
          longitude,
          variables: {},
          quality: {},
        };

        for (const variable of variables) {
          if (record[variable] !== undefined) {
            point.variables[variable] = record[variable];
          }
          // Quality codes are typically suffixed with _code
          if (record[`${variable}_code`] !== undefined) {
            point.quality[variable] = record[`${variable}_code`];
          }
        }

        dataPoints.push(point);
      }
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
    return {
      id: `bom-warning-${warning.id}`,
      source: "bom_warnings",
      type: "weather_alert",
      title: warning.title,
      description: warning.description,
      timestamp: new Date(warning.issueTime),
      metadata: {
        warningType: warning.type,
        severity: warning.severity,
        affectedAreas: warning.affectedAreas,
        expiryTime: warning.expiryTime,
      },
      relevanceScore: warning.severity === "extreme" ? 1.0
        : warning.severity === "severe" ? 0.8
        : warning.severity === "moderate" ? 0.6
        : 0.4,
    };
  }

  private observationToSignal(observation: BOMObservation, regionName: string): RawSignal {
    return {
      id: `bom-obs-${observation.stationId}-${observation.timestamp}`,
      source: "bom_observations",
      type: "weather_observation",
      title: `Weather observation for ${regionName}`,
      description: `Temperature: ${observation.temperature}°C, Humidity: ${observation.humidity}%, Rainfall: ${observation.rainfallSince9am}mm`,
      timestamp: new Date(observation.timestamp),
      metadata: {
        stationId: observation.stationId,
        stationName: observation.stationName,
        temperature: observation.temperature,
        humidity: observation.humidity,
        windSpeed: observation.windSpeed,
        rainfall: observation.rainfallSince9am,
      },
      relevanceScore: 0.5,
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
        signals.push({
          id: `bom-outlook-rain-${outlook.region}-${outlook.issueDate}`,
          source: "bom_seasonal",
          type: "climate_outlook",
          title: `Seasonal rainfall outlook for ${outlook.region}`,
          description: rainBelow > 60
            ? `Below median rainfall likely (${rainBelow}% probability)`
            : `Above median rainfall likely (${rainAbove}% probability)`,
          timestamp: new Date(outlook.issueDate),
          metadata: {
            region: outlook.region,
            validPeriod: outlook.validPeriod,
            belowMedianProbability: rainBelow,
            aboveMedianProbability: rainAbove,
          },
          relevanceScore: Math.max(rainBelow, rainAbove) / 100,
        });
      }
    }

    return signals;
  }

  // Simulated data methods (for development/testing)
  // In production, these would be replaced with actual BOM API calls

  private createSimulatedObservation(lat: number, lng: number, state: string): BOMObservation {
    const now = new Date();
    return {
      stationId: `SIM-${state}-001`,
      stationName: `Simulated Station ${state}`,
      latitude: lat,
      longitude: lng,
      timestamp: now.toISOString(),
      temperature: 20 + Math.random() * 15,
      apparentTemperature: 18 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      windSpeed: 5 + Math.random() * 20,
      windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
      pressure: 1010 + Math.random() * 20,
      rainfallSince9am: Math.random() * 5,
    };
  }

  private createSimulatedForecast(lat: number, lng: number, state: string): BOMForecast {
    const now = new Date();
    const days: BOMForecastDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      days.push({
        date: date.toISOString().split("T")[0],
        minTemp: 10 + Math.random() * 10,
        maxTemp: 20 + Math.random() * 15,
        precis: ["Sunny", "Partly cloudy", "Cloudy", "Chance of showers", "Showers"][Math.floor(Math.random() * 5)],
        precipitation: {
          probability: Math.floor(Math.random() * 100),
          amount: { min: 0, max: Math.floor(Math.random() * 10), units: "mm" },
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
          belowMedian: 25 + Math.floor(Math.random() * 25),
          nearMedian: 25 + Math.floor(Math.random() * 25),
          aboveMedian: 25 + Math.floor(Math.random() * 25),
        },
        medianRainfall: 100 + Math.floor(Math.random() * 200),
        units: "mm",
      },
      temperature: {
        maxTempOutlook: {
          belowMedian: 20 + Math.floor(Math.random() * 30),
          nearMedian: 20 + Math.floor(Math.random() * 30),
          aboveMedian: 20 + Math.floor(Math.random() * 30),
        },
        minTempOutlook: {
          belowMedian: 20 + Math.floor(Math.random() * 30),
          nearMedian: 20 + Math.floor(Math.random() * 30),
          aboveMedian: 20 + Math.floor(Math.random() * 30),
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
