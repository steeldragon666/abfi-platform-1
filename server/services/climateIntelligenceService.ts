/**
 * Climate Intelligence Service
 * Provides climate-based agricultural analytics and risk assessment
 */

import { getDb } from "../db";
import { eq, and, between, desc, gte, lte, sql } from "drizzle-orm";
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
} from "../../drizzle/schema";
import {
  createBOMConnector,
  BOMConnector,
  SILOTimeSeries,
  ClimateIntelligence,
  AGRICULTURAL_REGIONS,
} from "../connectors/bomConnector";

// Types
export interface ClimateRiskAssessment {
  location: {
    latitude: number;
    longitude: number;
    region?: string;
    state?: string;
  };
  assessmentDate: string;
  period: {
    start: string;
    end: string;
  };
  risks: {
    drought: {
      level: "low" | "moderate" | "high" | "extreme";
      probability: number;
      description: string;
    };
    frost: {
      level: "low" | "moderate" | "high";
      daysExpected: number;
      description: string;
    };
    heatStress: {
      level: "low" | "moderate" | "high";
      daysExpected: number;
      description: string;
    };
    flood: {
      level: "low" | "moderate" | "high";
      probability: number;
      description: string;
    };
  };
  overallRisk: "low" | "moderate" | "high" | "extreme";
  recommendations: string[];
  activeWarnings: Array<{
    type: string;
    severity: string;
    title: string;
    expiryTime?: string;
  }>;
}

export interface SeasonalForecast {
  region: string;
  state?: string;
  validPeriod: {
    start: string;
    end: string;
    months: string;
  };
  rainfall: {
    outlook: "below_average" | "near_average" | "above_average";
    probability: number;
    medianMm: number;
  };
  temperature: {
    maxOutlook: "below_average" | "near_average" | "above_average";
    minOutlook: "below_average" | "near_average" | "above_average";
    maxProbability: number;
    minProbability: number;
  };
  agriculturalImplications: string[];
}

export interface GrowingSeasonMetrics {
  location: {
    latitude: number;
    longitude: number;
  };
  season: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    growingDegreeDays: number;
    chillHours: number;
    totalRainfallMm: number;
    effectiveRainfallMm: number;
    frostDays: number;
    heatStressDays: number;
    averageMaxTemp: number;
    averageMinTemp: number;
  };
  comparison: {
    rainfallVsAverage: number; // % deviation from historical average
    tempVsAverage: number;
    gddVsAverage: number;
  };
  cropSuitability: Record<string, {
    suitable: boolean;
    score: number;
    notes: string;
  }>;
}

// Crop growing requirements
const CROP_REQUIREMENTS: Record<string, {
  minGDD: number;
  maxGDD: number;
  minRainfall: number;
  optimalRainfall: number;
  frostTolerance: "low" | "medium" | "high";
  heatTolerance: "low" | "medium" | "high";
  baseTemp: number;
}> = {
  wheat: {
    minGDD: 1200,
    maxGDD: 2500,
    minRainfall: 250,
    optimalRainfall: 450,
    frostTolerance: "high",
    heatTolerance: "medium",
    baseTemp: 0,
  },
  canola: {
    minGDD: 1000,
    maxGDD: 2000,
    minRainfall: 300,
    optimalRainfall: 500,
    frostTolerance: "high",
    heatTolerance: "low",
    baseTemp: 5,
  },
  barley: {
    minGDD: 1100,
    maxGDD: 2200,
    minRainfall: 200,
    optimalRainfall: 400,
    frostTolerance: "high",
    heatTolerance: "medium",
    baseTemp: 0,
  },
  sorghum: {
    minGDD: 1800,
    maxGDD: 3500,
    minRainfall: 300,
    optimalRainfall: 600,
    frostTolerance: "low",
    heatTolerance: "high",
    baseTemp: 10,
  },
  cotton: {
    minGDD: 2200,
    maxGDD: 4000,
    minRainfall: 500,
    optimalRainfall: 800,
    frostTolerance: "low",
    heatTolerance: "high",
    baseTemp: 12,
  },
  sugarcane: {
    minGDD: 3000,
    maxGDD: 5000,
    minRainfall: 1000,
    optimalRainfall: 1500,
    frostTolerance: "low",
    heatTolerance: "high",
    baseTemp: 12,
  },
};

/**
 * Climate Intelligence Service
 */
export class ClimateIntelligenceService {
  private bomConnector: BOMConnector;

  constructor() {
    this.bomConnector = createBOMConnector();
  }

  /**
   * Get comprehensive climate risk assessment for a location
   */
  async getClimateRiskAssessment(
    latitude: number,
    longitude: number,
    options: {
      includeHistorical?: boolean;
      forecastDays?: number;
    } = {}
  ): Promise<ClimateRiskAssessment> {
    const { includeHistorical = true, forecastDays = 14 } = options;

    // Get climate intelligence from connector
    const climateIntel = await this.bomConnector.getClimateIntelligence(
      latitude,
      longitude,
      { includeHistorical, historicalYears: 1 }
    );

    // Find nearest agricultural region
    const region = this.findNearestRegion(latitude, longitude);

    // Calculate risk levels
    const droughtRisk = this.assessDroughtRisk(climateIntel);
    const frostRisk = this.assessFrostRisk(climateIntel);
    const heatStressRisk = this.assessHeatStressRisk(climateIntel);
    const floodRisk = this.assessFloodRisk(climateIntel);

    // Determine overall risk
    const overallRisk = this.calculateOverallRisk([
      droughtRisk.level,
      frostRisk.level,
      heatStressRisk.level,
      floodRisk.level,
    ]);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      droughtRisk,
      frostRisk,
      heatStressRisk,
      floodRisk,
      climateIntel
    );

    // Format active warnings
    const activeWarnings = climateIntel.activeWarnings.map(w => ({
      type: w.type,
      severity: w.severity,
      title: w.title,
      expiryTime: w.expiryTime,
    }));

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + forecastDays);

    return {
      location: {
        latitude,
        longitude,
        region: region?.name,
        state: region?.state,
      },
      assessmentDate: now.toISOString().split("T")[0],
      period: {
        start: now.toISOString().split("T")[0],
        end: periodEnd.toISOString().split("T")[0],
      },
      risks: {
        drought: droughtRisk,
        frost: frostRisk,
        heatStress: heatStressRisk,
        flood: floodRisk,
      },
      overallRisk,
      recommendations,
      activeWarnings,
    };
  }

  /**
   * Get seasonal climate forecast for agricultural planning
   */
  async getSeasonalForecast(
    region?: string,
    state?: string
  ): Promise<SeasonalForecast[]> {
    // Get seasonal outlooks from connector
    const outlooks = await this.bomConnector.fetchSeasonalOutlook(region || state);

    return outlooks.map(outlook => {
      // Determine rainfall outlook
      const rainProbs = outlook.rainfall.tercileProbabilities;
      let rainfallOutlook: "below_average" | "near_average" | "above_average";
      let rainfallProbability: number;

      if (rainProbs.belowMedian >= rainProbs.aboveMedian && rainProbs.belowMedian > 40) {
        rainfallOutlook = "below_average";
        rainfallProbability = rainProbs.belowMedian;
      } else if (rainProbs.aboveMedian > rainProbs.belowMedian && rainProbs.aboveMedian > 40) {
        rainfallOutlook = "above_average";
        rainfallProbability = rainProbs.aboveMedian;
      } else {
        rainfallOutlook = "near_average";
        rainfallProbability = rainProbs.nearMedian;
      }

      // Determine temperature outlooks
      const maxTempProbs = outlook.temperature.maxTempOutlook;
      const minTempProbs = outlook.temperature.minTempOutlook;

      const maxOutlook = maxTempProbs.aboveMedian > 40 ? "above_average"
        : maxTempProbs.belowMedian > 40 ? "below_average" : "near_average";
      const minOutlook = minTempProbs.aboveMedian > 40 ? "above_average"
        : minTempProbs.belowMedian > 40 ? "below_average" : "near_average";

      // Generate agricultural implications
      const implications = this.generateAgriculturalImplications(
        rainfallOutlook,
        maxOutlook,
        minOutlook
      );

      return {
        region: outlook.region,
        state: undefined, // Not always available
        validPeriod: {
          start: outlook.validPeriod.start,
          end: outlook.validPeriod.end,
          months: outlook.validPeriod.months,
        },
        rainfall: {
          outlook: rainfallOutlook,
          probability: rainfallProbability,
          medianMm: outlook.rainfall.medianRainfall,
        },
        temperature: {
          maxOutlook,
          minOutlook,
          maxProbability: Math.max(maxTempProbs.aboveMedian, maxTempProbs.belowMedian, maxTempProbs.nearMedian),
          minProbability: Math.max(minTempProbs.aboveMedian, minTempProbs.belowMedian, minTempProbs.nearMedian),
        },
        agriculturalImplications: implications,
      };
    });
  }

  /**
   * Get growing season metrics for a location
   */
  async getGrowingSeasonMetrics(
    latitude: number,
    longitude: number,
    seasonStart: string,
    seasonEnd: string
  ): Promise<GrowingSeasonMetrics> {
    // Fetch climate data for the growing season
    const climateData = await this.bomConnector.fetchGrowingSeasonData(
      latitude,
      longitude,
      seasonStart,
      seasonEnd
    );

    // Calculate metrics
    const metrics = this.calculateGrowingSeasonMetrics(climateData);

    // Assess crop suitability
    const cropSuitability = this.assessCropSuitability(metrics);

    // Calculate season identifier
    const startYear = new Date(seasonStart).getFullYear();
    const endYear = new Date(seasonEnd).getFullYear();
    const season = startYear === endYear ? `${startYear}` : `${startYear}-${endYear.toString().slice(-2)}`;

    return {
      location: { latitude, longitude },
      season,
      period: {
        start: seasonStart,
        end: seasonEnd,
      },
      metrics,
      comparison: {
        rainfallVsAverage: 0, // Would require historical baseline data
        tempVsAverage: 0,
        gddVsAverage: 0,
      },
      cropSuitability,
    };
  }

  /**
   * Get climate metrics for a property
   */
  async getPropertyClimateMetrics(
    propertyId: number,
    startDate: string,
    endDate: string
  ): Promise<GrowingSeasonMetrics | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get property location
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property || !property.latitude || !property.longitude) {
      return null;
    }

    return this.getGrowingSeasonMetrics(
      parseFloat(property.latitude),
      parseFloat(property.longitude),
      startDate,
      endDate
    );
  }

  /**
   * Get active weather warnings for a region or state
   */
  async getActiveWarnings(
    options: {
      state?: string;
      severity?: string;
      type?: string;
    } = {}
  ): Promise<Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    issueTime: string;
    expiryTime?: string;
    affectedAreas: string[];
  }>> {
    const warnings = await this.bomConnector.fetchActiveWarnings(options.state);

    return warnings
      .filter(w => {
        if (options.severity && w.severity !== options.severity) return false;
        if (options.type && w.type !== options.type) return false;
        return true;
      })
      .map(w => ({
        id: w.id,
        type: w.type,
        severity: w.severity,
        title: w.title,
        description: w.description,
        issueTime: w.issueTime,
        expiryTime: w.expiryTime,
        affectedAreas: w.affectedAreas,
      }));
  }

  /**
   * Store climate metrics in the database
   */
  async storeClimateMetrics(
    metrics: GrowingSeasonMetrics,
    options: {
      propertyId?: number;
      supplierId?: number;
      region?: string;
      cropType?: string;
    } = {}
  ): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(agriculturalClimateMetrics).values({
      propertyId: options.propertyId || null,
      supplierId: options.supplierId || null,
      latitude: metrics.location.latitude.toString(),
      longitude: metrics.location.longitude.toString(),
      region: options.region || null,
      periodStart: metrics.period.start,
      periodEnd: metrics.period.end,
      season: metrics.season,
      cropType: options.cropType || null,
      growingDegreeDays: metrics.metrics.growingDegreeDays,
      chillHours: metrics.metrics.chillHours,
      effectiveRainfallMm: metrics.metrics.effectiveRainfallMm.toString(),
      frostDays: metrics.metrics.frostDays,
      heatStressDays: metrics.metrics.heatStressDays,
      droughtIndex: "0", // Would need to calculate
      frostRisk: metrics.metrics.frostDays > 10 ? "high" : metrics.metrics.frostDays > 3 ? "moderate" : "low",
      heatStressRisk: metrics.metrics.heatStressDays > 10 ? "high" : metrics.metrics.heatStressDays > 3 ? "moderate" : "low",
      droughtRisk: "moderate", // Would need more data to calculate
      dataSource: "SILO",
      calculatedAt: new Date(),
    });

    return result.insertId;
  }

  /**
   * Get historical climate data from database
   */
  async getHistoricalClimateData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<typeof siloClimateData.$inferSelect[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Query with a small tolerance for coordinate matching
    const tolerance = 0.05; // ~5km

    return db
      .select()
      .from(siloClimateData)
      .where(and(
        gte(siloClimateData.latitude, (latitude - tolerance).toString()),
        lte(siloClimateData.latitude, (latitude + tolerance).toString()),
        gte(siloClimateData.longitude, (longitude - tolerance).toString()),
        lte(siloClimateData.longitude, (longitude + tolerance).toString()),
        gte(siloClimateData.date, startDate),
        lte(siloClimateData.date, endDate)
      ))
      .orderBy(siloClimateData.date);
  }

  // Private helper methods

  private findNearestRegion(lat: number, lng: number): typeof AGRICULTURAL_REGIONS[0] | undefined {
    let nearest = AGRICULTURAL_REGIONS[0];
    let minDist = Number.MAX_VALUE;

    for (const region of AGRICULTURAL_REGIONS) {
      const dist = Math.sqrt(
        Math.pow(region.lat - lat, 2) + Math.pow(region.lng - lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = region;
      }
    }

    return minDist < 3 ? nearest : undefined; // Only return if within ~300km
  }

  private assessDroughtRisk(climate: ClimateIntelligence): ClimateRiskAssessment["risks"]["drought"] {
    const droughtIndex = climate.agriculturalMetrics.droughtIndex || 0;
    const outlook = climate.seasonalOutlook;

    // Check seasonal rainfall outlook
    let outlookFactor = 0;
    if (outlook) {
      const belowMedian = outlook.rainfall.tercileProbabilities.belowMedian;
      if (belowMedian > 60) outlookFactor = 0.3;
      else if (belowMedian > 50) outlookFactor = 0.15;
    }

    const combinedRisk = Math.min(1, droughtIndex + outlookFactor);

    let level: "low" | "moderate" | "high" | "extreme";
    if (combinedRisk < 0.25) level = "low";
    else if (combinedRisk < 0.5) level = "moderate";
    else if (combinedRisk < 0.75) level = "high";
    else level = "extreme";

    return {
      level,
      probability: Math.round(combinedRisk * 100),
      description: this.getDroughtDescription(level, outlook),
    };
  }

  private assessFrostRisk(climate: ClimateIntelligence): ClimateRiskAssessment["risks"]["frost"] {
    const frostRisk = climate.agriculturalMetrics.frostRisk || "low";
    const forecast = climate.forecast;

    // Check forecast for frost conditions
    let frostDaysExpected = 0;
    if (forecast) {
      for (const day of forecast.days) {
        if (day.minTemp !== undefined && day.minTemp < 2) {
          frostDaysExpected++;
        }
      }
    }

    return {
      level: frostRisk,
      daysExpected: frostDaysExpected,
      description: this.getFrostDescription(frostRisk, frostDaysExpected),
    };
  }

  private assessHeatStressRisk(climate: ClimateIntelligence): ClimateRiskAssessment["risks"]["heatStress"] {
    const heatRisk = climate.agriculturalMetrics.heatStressRisk || "low";
    const forecast = climate.forecast;

    // Check forecast for heat stress conditions
    let heatDaysExpected = 0;
    if (forecast) {
      for (const day of forecast.days) {
        if (day.maxTemp !== undefined && day.maxTemp > 35) {
          heatDaysExpected++;
        }
      }
    }

    return {
      level: heatRisk,
      daysExpected: heatDaysExpected,
      description: this.getHeatStressDescription(heatRisk, heatDaysExpected),
    };
  }

  private assessFloodRisk(climate: ClimateIntelligence): ClimateRiskAssessment["risks"]["flood"] {
    const outlook = climate.seasonalOutlook;
    const warnings = climate.activeWarnings;

    // Check for active flood warnings
    const hasFloodWarning = warnings.some(w => w.type === "flood");

    // Check seasonal rainfall outlook
    let rainRisk = 0;
    if (outlook) {
      const aboveMedian = outlook.rainfall.tercileProbabilities.aboveMedian;
      if (aboveMedian > 70) rainRisk = 0.6;
      else if (aboveMedian > 55) rainRisk = 0.3;
    }

    if (hasFloodWarning) rainRisk = Math.max(rainRisk, 0.7);

    let level: "low" | "moderate" | "high";
    if (rainRisk < 0.3) level = "low";
    else if (rainRisk < 0.6) level = "moderate";
    else level = "high";

    return {
      level,
      probability: Math.round(rainRisk * 100),
      description: this.getFloodDescription(level, hasFloodWarning),
    };
  }

  private calculateOverallRisk(
    risks: Array<"low" | "moderate" | "high" | "extreme">
  ): "low" | "moderate" | "high" | "extreme" {
    const riskScores = { low: 1, moderate: 2, high: 3, extreme: 4 };
    const avgScore = risks.reduce((sum, r) => sum + riskScores[r], 0) / risks.length;

    if (avgScore < 1.5) return "low";
    if (avgScore < 2.5) return "moderate";
    if (avgScore < 3.5) return "high";
    return "extreme";
  }

  private generateRecommendations(
    drought: ClimateRiskAssessment["risks"]["drought"],
    frost: ClimateRiskAssessment["risks"]["frost"],
    heatStress: ClimateRiskAssessment["risks"]["heatStress"],
    flood: ClimateRiskAssessment["risks"]["flood"],
    climate: ClimateIntelligence
  ): string[] {
    const recommendations: string[] = [];

    if (drought.level === "high" || drought.level === "extreme") {
      recommendations.push("Consider drought-tolerant crop varieties");
      recommendations.push("Implement water conservation measures");
      recommendations.push("Review irrigation scheduling and efficiency");
    }

    if (frost.level === "high" && frost.daysExpected > 3) {
      recommendations.push("Delay planting of frost-sensitive crops");
      recommendations.push("Consider frost protection measures for existing crops");
    }

    if (heatStress.level === "high" && heatStress.daysExpected > 5) {
      recommendations.push("Ensure adequate water availability during heat events");
      recommendations.push("Consider shade or cooling strategies for sensitive crops");
    }

    if (flood.level === "high") {
      recommendations.push("Review drainage and waterlogging risk on low-lying paddocks");
      recommendations.push("Monitor BOM flood warnings closely");
    }

    if (climate.activeWarnings.length > 0) {
      recommendations.push("Active weather warnings in effect - monitor conditions closely");
    }

    if (recommendations.length === 0) {
      recommendations.push("Current climate conditions are favorable for most agricultural activities");
    }

    return recommendations;
  }

  private getDroughtDescription(
    level: string,
    outlook: ClimateIntelligence["seasonalOutlook"]
  ): string {
    const baseDesc: Record<string, string> = {
      low: "Soil moisture levels adequate. Normal rainfall expected.",
      moderate: "Some moisture deficit detected. Monitor conditions.",
      high: "Significant moisture deficit. Water conservation recommended.",
      extreme: "Severe drought conditions. Implement drought management strategies.",
    };

    let desc = baseDesc[level] || "";

    if (outlook && outlook.rainfall.tercileProbabilities.belowMedian > 50) {
      desc += " Seasonal outlook indicates below-average rainfall likely.";
    }

    return desc;
  }

  private getFrostDescription(level: string, daysExpected: number): string {
    if (level === "low") {
      return "Minimal frost risk. Conditions favorable for frost-sensitive crops.";
    }
    if (level === "moderate") {
      return `Moderate frost risk. ${daysExpected} frost days possible in forecast period.`;
    }
    return `High frost risk. ${daysExpected} frost days expected. Protect sensitive crops.`;
  }

  private getHeatStressDescription(level: string, daysExpected: number): string {
    if (level === "low") {
      return "Low heat stress risk. Temperatures within normal range.";
    }
    if (level === "moderate") {
      return `Moderate heat stress risk. ${daysExpected} days above 35°C expected.`;
    }
    return `High heat stress risk. ${daysExpected} extreme heat days forecast. Take precautions.`;
  }

  private getFloodDescription(level: string, hasWarning: boolean): string {
    if (hasWarning) {
      return "Active flood warning in effect. Monitor conditions and BOM updates.";
    }
    if (level === "low") {
      return "Low flood risk. Normal conditions expected.";
    }
    if (level === "moderate") {
      return "Moderate flood risk. Above-average rainfall possible.";
    }
    return "Elevated flood risk. Significantly above-average rainfall expected.";
  }

  private generateAgriculturalImplications(
    rainfallOutlook: string,
    maxTempOutlook: string,
    minTempOutlook: string
  ): string[] {
    const implications: string[] = [];

    // Rainfall implications
    if (rainfallOutlook === "below_average") {
      implications.push("Consider drought-resistant varieties for late plantings");
      implications.push("Review irrigation requirements and water allocations");
      implications.push("Monitor soil moisture levels closely");
    } else if (rainfallOutlook === "above_average") {
      implications.push("Increased disease pressure possible - monitor fungicide needs");
      implications.push("Good conditions for pasture establishment");
      implications.push("May impact harvest timing and grain quality");
    } else {
      implications.push("Average rainfall conditions - standard crop management recommended");
    }

    // Temperature implications
    if (maxTempOutlook === "above_average") {
      implications.push("Higher evapotranspiration rates expected");
      implications.push("Watch for heat stress in livestock and crops");
    }

    if (minTempOutlook === "below_average") {
      implications.push("Increased frost risk for spring plantings");
    }

    return implications;
  }

  private calculateGrowingSeasonMetrics(
    climateData: SILOTimeSeries
  ): GrowingSeasonMetrics["metrics"] {
    const data = climateData.data;

    let totalRainfall = 0;
    let effectiveRainfall = 0;
    let totalMaxTemp = 0;
    let totalMinTemp = 0;
    let gdd = 0;
    let chillHours = 0;
    let frostDays = 0;
    let heatStressDays = 0;
    let validTempDays = 0;

    for (const point of data) {
      const rain = point.variables.daily_rain;
      const maxTemp = point.variables.max_temp;
      const minTemp = point.variables.min_temp;

      // Rainfall
      if (rain !== null && rain !== undefined) {
        totalRainfall += rain;
        // Effective rainfall: exclude very small events and cap large events
        if (rain > 5) {
          effectiveRainfall += Math.min(rain, 25);
        }
      }

      // Temperature metrics
      if (maxTemp !== null && maxTemp !== undefined &&
          minTemp !== null && minTemp !== undefined) {
        validTempDays++;
        totalMaxTemp += maxTemp;
        totalMinTemp += minTemp;

        // GDD with base temp of 0°C (for wheat)
        const avgTemp = (maxTemp + minTemp) / 2;
        gdd += Math.max(0, avgTemp);

        // Chill hours (crude estimate)
        if (minTemp < 7) {
          chillHours += Math.min(12, (7 - minTemp) * 2);
        }

        // Frost days
        if (minTemp < 2) {
          frostDays++;
        }

        // Heat stress days
        if (maxTemp > 35) {
          heatStressDays++;
        }
      }
    }

    return {
      growingDegreeDays: Math.round(gdd),
      chillHours: Math.round(chillHours),
      totalRainfallMm: Math.round(totalRainfall * 10) / 10,
      effectiveRainfallMm: Math.round(effectiveRainfall * 10) / 10,
      frostDays,
      heatStressDays,
      averageMaxTemp: validTempDays > 0 ? Math.round((totalMaxTemp / validTempDays) * 10) / 10 : 0,
      averageMinTemp: validTempDays > 0 ? Math.round((totalMinTemp / validTempDays) * 10) / 10 : 0,
    };
  }

  private assessCropSuitability(
    metrics: GrowingSeasonMetrics["metrics"]
  ): Record<string, { suitable: boolean; score: number; notes: string }> {
    const suitability: Record<string, { suitable: boolean; score: number; notes: string }> = {};

    for (const [crop, requirements] of Object.entries(CROP_REQUIREMENTS)) {
      let score = 100;
      const notes: string[] = [];

      // GDD assessment
      if (metrics.growingDegreeDays < requirements.minGDD) {
        const deficit = requirements.minGDD - metrics.growingDegreeDays;
        score -= Math.min(40, (deficit / requirements.minGDD) * 60);
        notes.push(`GDD deficit: ${deficit} below minimum`);
      } else if (metrics.growingDegreeDays > requirements.maxGDD) {
        score -= 10;
        notes.push("GDD slightly above optimal range");
      }

      // Rainfall assessment
      if (metrics.effectiveRainfallMm < requirements.minRainfall) {
        score -= 30;
        notes.push("Insufficient rainfall - irrigation required");
      } else if (metrics.effectiveRainfallMm < requirements.optimalRainfall) {
        score -= 10;
        notes.push("Below optimal rainfall");
      }

      // Frost assessment
      if (requirements.frostTolerance === "low" && metrics.frostDays > 2) {
        score -= 25;
        notes.push("Frost risk too high for this crop");
      } else if (requirements.frostTolerance === "medium" && metrics.frostDays > 5) {
        score -= 15;
        notes.push("Elevated frost risk");
      }

      // Heat stress assessment
      if (requirements.heatTolerance === "low" && metrics.heatStressDays > 3) {
        score -= 25;
        notes.push("Heat stress risk too high");
      } else if (requirements.heatTolerance === "medium" && metrics.heatStressDays > 7) {
        score -= 15;
        notes.push("Elevated heat stress risk");
      }

      suitability[crop] = {
        suitable: score >= 60,
        score: Math.max(0, Math.round(score)),
        notes: notes.length > 0 ? notes.join("; ") : "Conditions suitable",
      };
    }

    return suitability;
  }
}

// Export singleton instance
export const climateIntelligenceService = new ClimateIntelligenceService();
