/**
 * Feedstock Quality Vision Service
 * Computer vision-based quality assessment from photos
 *
 * Features:
 * - Moisture content estimation from visual analysis
 * - Contamination detection (foreign materials, mold)
 * - Dry matter yield estimation
 * - Quality grade classification (A/B/C/D)
 *
 * Target Accuracy:
 * - Moisture content: ±2%
 * - Quality grade: 95% accuracy
 *
 * Note: This service provides simulated analysis in development.
 * In production, would integrate with:
 * - TensorFlow.js or ONNX Runtime for on-device inference
 * - AWS Rekognition for cloud inference
 * - Custom MobileNetV3 model trained on feedstock images
 */

import { logger } from "../utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QualityAssessment {
  feedstockType: string;
  analysisDate: Date;

  // Moisture analysis
  moistureContentPercent: number;
  moistureConfidence: number;
  moistureCategory: "dry" | "optimal" | "wet" | "too_wet";

  // Contamination analysis
  contaminationRisk: "low" | "medium" | "high";
  contaminationDetails: ContaminationDetail[];

  // Yield estimation
  dryMatterYieldEstimate: number;  // kg/m³
  yieldConfidence: number;

  // Overall quality grade
  qualityGrade: "A" | "B" | "C" | "D" | "reject";
  gradeReasons: string[];

  // Pricing impact
  suggestedPriceModifier: number;  // Multiplier (e.g., 0.95 for 5% discount)

  // Model metadata
  modelVersion: string;
  processingTimeMs: number;
  imageCount: number;
}

export interface ContaminationDetail {
  type: "foreign_material" | "mold" | "pest_damage" | "soil" | "plastic" | "metal";
  confidence: number;
  description: string;
  locationInImage?: string;
}

export interface ImageAnalysisRequest {
  images: string[];  // Base64 encoded images
  feedstockType: string;
  expectedMoistureRange?: { min: number; max: number };
  notes?: string;
}

export interface SatelliteYieldEstimate {
  propertyId?: string;
  boundaryPolygon?: GeoJSONPolygon;
  centroid: { latitude: number; longitude: number };
  imageryDate: Date;

  // NDVI analysis
  meanNDVI: number;
  minNDVI: number;
  maxNDVI: number;
  ndviStdDev: number;

  // Yield estimation
  estimatedYieldTonnesPerHa: number;
  yieldConfidenceInterval: { lower: number; upper: number };
  yieldVariability: "low" | "medium" | "high";

  // Field health
  fieldHealthScore: number;  // 0-100
  healthIssues: string[];

  // Comparison
  comparedToRegionalAverage: number;  // % difference
  comparedToHistorical: number;  // % difference from same time last year

  // Metadata
  satelliteSource: "sentinel-2" | "landsat-8" | "modis";
  cloudCoverPercent: number;
  processingMethod: string;
}

interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const QUALITY_CONFIG = {
  modelVersion: "1.0.0-simulation",

  // Moisture thresholds by feedstock type (%)
  moistureThresholds: {
    wheat: { dry: 10, optimal: 12.5, wet: 14, maxAcceptable: 16 },
    barley: { dry: 10, optimal: 12, wet: 14, maxAcceptable: 15 },
    canola: { dry: 6, optimal: 8, wet: 10, maxAcceptable: 12 },
    sugarcane: { dry: 65, optimal: 70, wet: 75, maxAcceptable: 80 },
    sorghum: { dry: 11, optimal: 13, wet: 15, maxAcceptable: 17 },
    straw: { dry: 8, optimal: 12, wet: 15, maxAcceptable: 18 },
    default: { dry: 10, optimal: 14, wet: 18, maxAcceptable: 20 },
  },

  // Quality grade thresholds
  gradeThresholds: {
    A: { minMoistureScore: 0.9, maxContamination: "low", minYieldScore: 0.85 },
    B: { minMoistureScore: 0.7, maxContamination: "medium", minYieldScore: 0.7 },
    C: { minMoistureScore: 0.5, maxContamination: "medium", minYieldScore: 0.5 },
    D: { minMoistureScore: 0.3, maxContamination: "high", minYieldScore: 0.3 },
  },

  // Price modifiers by grade
  priceModifiers: {
    A: 1.05,    // 5% premium
    B: 1.0,     // Base price
    C: 0.92,    // 8% discount
    D: 0.80,    // 20% discount
    reject: 0,  // Not acceptable
  },

  // NDVI to yield regression coefficients (by feedstock)
  ndviYieldCoefficients: {
    wheat: { intercept: -2.5, slope: 8.2 },  // tonnes/ha = -2.5 + 8.2 * NDVI
    barley: { intercept: -2.0, slope: 7.5 },
    canola: { intercept: -1.5, slope: 4.8 },
    sugarcane: { intercept: 20, slope: 100 },  // Much higher for cane
    sorghum: { intercept: -1.8, slope: 7.0 },
    default: { intercept: -2.0, slope: 6.5 },
  },
};

// ============================================================================
// QUALITY VISION SERVICE
// ============================================================================

/**
 * Analyze feedstock quality from photos
 */
export async function analyzeQualityFromPhotos(
  request: ImageAnalysisRequest
): Promise<QualityAssessment> {
  const startTime = Date.now();
  const { images, feedstockType, expectedMoistureRange } = request;

  logger.info("QUALITY_VISION", `Analyzing ${images.length} images for ${feedstockType}`);

  // In production, would run inference on images
  // For now, generate realistic simulated results
  const analysis = simulateImageAnalysis(feedstockType, images.length, expectedMoistureRange);

  // Calculate quality grade
  const { grade, reasons } = calculateQualityGrade(
    feedstockType,
    analysis.moistureContentPercent,
    analysis.contaminationRisk,
    analysis.dryMatterYieldEstimate
  );

  const processingTimeMs = Date.now() - startTime;

  return {
    feedstockType,
    analysisDate: new Date(),
    moistureContentPercent: analysis.moistureContentPercent,
    moistureConfidence: analysis.moistureConfidence,
    moistureCategory: analysis.moistureCategory,
    contaminationRisk: analysis.contaminationRisk,
    contaminationDetails: analysis.contaminationDetails,
    dryMatterYieldEstimate: analysis.dryMatterYieldEstimate,
    yieldConfidence: analysis.yieldConfidence,
    qualityGrade: grade,
    gradeReasons: reasons,
    suggestedPriceModifier: QUALITY_CONFIG.priceModifiers[grade],
    modelVersion: QUALITY_CONFIG.modelVersion,
    processingTimeMs,
    imageCount: images.length,
  };
}

/**
 * Estimate yield from satellite imagery (NDVI analysis)
 */
export async function estimateYieldFromSatellite(
  latitude: number,
  longitude: number,
  feedstockType: string,
  boundaryPolygon?: GeoJSONPolygon
): Promise<SatelliteYieldEstimate> {
  logger.info("QUALITY_VISION", `Estimating yield at ${latitude}, ${longitude} for ${feedstockType}`);

  // In production, would:
  // 1. Fetch Sentinel-2 imagery from AWS Open Data
  // 2. Clip to property boundary
  // 3. Calculate NDVI
  // 4. Apply regression model

  // Simulate realistic NDVI values based on season and location
  const ndviData = simulateNDVIAnalysis(latitude, longitude, feedstockType);

  // Calculate yield from NDVI
  const coefficients = QUALITY_CONFIG.ndviYieldCoefficients[feedstockType as keyof typeof QUALITY_CONFIG.ndviYieldCoefficients]
    || QUALITY_CONFIG.ndviYieldCoefficients.default;

  const estimatedYield = coefficients.intercept + coefficients.slope * ndviData.meanNDVI;
  const yieldVariance = ndviData.ndviStdDev * coefficients.slope;

  // Field health score based on NDVI uniformity
  const uniformityScore = 1 - (ndviData.ndviStdDev / ndviData.meanNDVI);
  const fieldHealthScore = Math.round(
    (ndviData.meanNDVI * 100 * 0.6 + uniformityScore * 100 * 0.4)
  );

  // Health issues based on NDVI patterns
  const healthIssues: string[] = [];
  if (ndviData.meanNDVI < 0.4) {
    healthIssues.push("Low overall vegetation vigor - possible stress");
  }
  if (ndviData.ndviStdDev > 0.15) {
    healthIssues.push("High variability - patchy growth or variable soil conditions");
  }
  if (ndviData.minNDVI < 0.2) {
    healthIssues.push("Bare/dead patches detected");
  }

  return {
    centroid: { latitude, longitude },
    boundaryPolygon,
    imageryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    meanNDVI: ndviData.meanNDVI,
    minNDVI: ndviData.minNDVI,
    maxNDVI: ndviData.maxNDVI,
    ndviStdDev: ndviData.ndviStdDev,
    estimatedYieldTonnesPerHa: Math.max(0, Math.round(estimatedYield * 10) / 10),
    yieldConfidenceInterval: {
      lower: Math.max(0, Math.round((estimatedYield - 1.96 * yieldVariance) * 10) / 10),
      upper: Math.round((estimatedYield + 1.96 * yieldVariance) * 10) / 10,
    },
    yieldVariability: ndviData.ndviStdDev < 0.08 ? "low" : ndviData.ndviStdDev < 0.15 ? "medium" : "high",
    fieldHealthScore,
    healthIssues,
    comparedToRegionalAverage: Math.round((Math.random() - 0.3) * 30),
    comparedToHistorical: Math.round((Math.random() - 0.4) * 20),
    satelliteSource: "sentinel-2",
    cloudCoverPercent: Math.round(Math.random() * 20),
    processingMethod: "NDVI regression (simulated)",
  };
}

/**
 * Batch analyze multiple images and aggregate results
 */
export async function batchAnalyzeQuality(
  requests: ImageAnalysisRequest[]
): Promise<{
  results: QualityAssessment[];
  aggregateSummary: {
    averageMoisture: number;
    averageGrade: string;
    totalImages: number;
    processingTimeMs: number;
  };
}> {
  const startTime = Date.now();
  const results: QualityAssessment[] = [];

  for (const request of requests) {
    const result = await analyzeQualityFromPhotos(request);
    results.push(result);
  }

  // Calculate aggregate statistics
  const totalImages = results.reduce((sum, r) => sum + r.imageCount, 0);
  const averageMoisture = results.reduce((sum, r) => sum + r.moistureContentPercent, 0) / results.length;

  // Calculate average grade (A=4, B=3, C=2, D=1, reject=0)
  const gradeValues: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, reject: 0 };
  const avgGradeValue = results.reduce((sum, r) => sum + gradeValues[r.qualityGrade], 0) / results.length;
  const averageGrade = avgGradeValue >= 3.5 ? "A" : avgGradeValue >= 2.5 ? "B" : avgGradeValue >= 1.5 ? "C" : avgGradeValue >= 0.5 ? "D" : "reject";

  return {
    results,
    aggregateSummary: {
      averageMoisture: Math.round(averageMoisture * 10) / 10,
      averageGrade,
      totalImages,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// ============================================================================
// SIMULATION FUNCTIONS (for development)
// ============================================================================

function simulateImageAnalysis(
  feedstockType: string,
  imageCount: number,
  expectedMoistureRange?: { min: number; max: number }
): {
  moistureContentPercent: number;
  moistureConfidence: number;
  moistureCategory: "dry" | "optimal" | "wet" | "too_wet";
  contaminationRisk: "low" | "medium" | "high";
  contaminationDetails: ContaminationDetail[];
  dryMatterYieldEstimate: number;
  yieldConfidence: number;
} {
  const thresholds = QUALITY_CONFIG.moistureThresholds[feedstockType as keyof typeof QUALITY_CONFIG.moistureThresholds]
    || QUALITY_CONFIG.moistureThresholds.default;

  // Generate realistic moisture content
  let moistureContentPercent: number;
  if (expectedMoistureRange) {
    moistureContentPercent = expectedMoistureRange.min + Math.random() * (expectedMoistureRange.max - expectedMoistureRange.min);
  } else {
    // Generate around optimal with some variance
    moistureContentPercent = thresholds.optimal + (Math.random() - 0.5) * 6;
  }
  moistureContentPercent = Math.round(moistureContentPercent * 10) / 10;

  // Determine moisture category
  let moistureCategory: "dry" | "optimal" | "wet" | "too_wet";
  if (moistureContentPercent <= thresholds.dry) {
    moistureCategory = "dry";
  } else if (moistureContentPercent <= thresholds.wet) {
    moistureCategory = "optimal";
  } else if (moistureContentPercent <= thresholds.maxAcceptable) {
    moistureCategory = "wet";
  } else {
    moistureCategory = "too_wet";
  }

  // Confidence based on image count (more images = higher confidence)
  const moistureConfidence = Math.min(0.95, 0.7 + imageCount * 0.05);

  // Simulate contamination detection
  const contaminationRoll = Math.random();
  let contaminationRisk: "low" | "medium" | "high" = "low";
  const contaminationDetails: ContaminationDetail[] = [];

  if (contaminationRoll < 0.1) {
    contaminationRisk = "high";
    contaminationDetails.push({
      type: "foreign_material",
      confidence: 0.85,
      description: "Stone or metal debris detected",
    });
  } else if (contaminationRoll < 0.25) {
    contaminationRisk = "medium";
    contaminationDetails.push({
      type: "soil",
      confidence: 0.78,
      description: "Minor soil contamination detected",
    });
  }

  // Small chance of mold detection
  if (moistureContentPercent > thresholds.wet && Math.random() < 0.3) {
    contaminationDetails.push({
      type: "mold",
      confidence: 0.72,
      description: "Potential mold/fungal growth on surface",
    });
    contaminationRisk = "medium";
  }

  // Dry matter yield estimation (kg/m³)
  const baseYield = feedstockType === "sugarcane" ? 250 : 150;
  const moistureAdjustment = (100 - moistureContentPercent) / 100;
  const dryMatterYieldEstimate = Math.round(baseYield * moistureAdjustment * (0.9 + Math.random() * 0.2));

  return {
    moistureContentPercent,
    moistureConfidence,
    moistureCategory,
    contaminationRisk,
    contaminationDetails,
    dryMatterYieldEstimate,
    yieldConfidence: Math.min(0.9, 0.7 + imageCount * 0.04),
  };
}

function simulateNDVIAnalysis(
  latitude: number,
  longitude: number,
  feedstockType: string
): {
  meanNDVI: number;
  minNDVI: number;
  maxNDVI: number;
  ndviStdDev: number;
} {
  // Base NDVI varies by season (January = summer in Australia)
  const month = new Date().getMonth();
  const isGrowingSeason = month >= 8 || month <= 2; // Sep-Feb

  // Base NDVI for healthy crop
  let baseNDVI = isGrowingSeason ? 0.65 : 0.45;

  // Adjust for latitude (tropical north vs temperate south)
  if (latitude > -20) {
    // Northern QLD - generally wetter
    baseNDVI += 0.1;
  } else if (latitude < -35) {
    // Southern regions - more variable
    baseNDVI -= 0.05;
  }

  // Add some random variation
  baseNDVI += (Math.random() - 0.5) * 0.15;
  baseNDVI = Math.max(0.2, Math.min(0.85, baseNDVI));

  // Generate statistics
  const stdDev = 0.05 + Math.random() * 0.12;
  const minNDVI = Math.max(0.1, baseNDVI - stdDev * 2.5);
  const maxNDVI = Math.min(0.9, baseNDVI + stdDev * 1.5);

  return {
    meanNDVI: Math.round(baseNDVI * 100) / 100,
    minNDVI: Math.round(minNDVI * 100) / 100,
    maxNDVI: Math.round(maxNDVI * 100) / 100,
    ndviStdDev: Math.round(stdDev * 100) / 100,
  };
}

function calculateQualityGrade(
  feedstockType: string,
  moisturePercent: number,
  contaminationRisk: "low" | "medium" | "high",
  yieldEstimate: number
): {
  grade: "A" | "B" | "C" | "D" | "reject";
  reasons: string[];
} {
  const thresholds = QUALITY_CONFIG.moistureThresholds[feedstockType as keyof typeof QUALITY_CONFIG.moistureThresholds]
    || QUALITY_CONFIG.moistureThresholds.default;

  const reasons: string[] = [];

  // Check for automatic rejection
  if (moisturePercent > thresholds.maxAcceptable) {
    return {
      grade: "reject",
      reasons: [`Moisture content (${moisturePercent}%) exceeds maximum acceptable (${thresholds.maxAcceptable}%)`],
    };
  }

  if (contaminationRisk === "high") {
    reasons.push("High contamination risk detected");
    return { grade: "D", reasons };
  }

  // Calculate moisture score (1.0 at optimal, decreasing away from it)
  const moistureDeviation = Math.abs(moisturePercent - thresholds.optimal);
  const moistureScore = Math.max(0, 1 - moistureDeviation / 10);

  // Determine grade
  let grade: "A" | "B" | "C" | "D";

  if (moistureScore >= 0.85 && contaminationRisk === "low") {
    grade = "A";
    reasons.push("Optimal moisture content");
    reasons.push("No contamination detected");
  } else if (moistureScore >= 0.65 && contaminationRisk !== "high") {
    grade = "B";
    if (moistureScore < 0.85) {
      reasons.push(`Moisture content (${moisturePercent}%) slightly off optimal (${thresholds.optimal}%)`);
    }
    if (contaminationRisk === "medium") {
      reasons.push("Minor contamination detected");
    }
  } else if (moistureScore >= 0.4) {
    grade = "C";
    reasons.push(`Moisture content (${moisturePercent}%) significantly off optimal`);
    if (contaminationRisk === "medium") {
      reasons.push("Contamination issues present");
    }
  } else {
    grade = "D";
    reasons.push(`Moisture content (${moisturePercent}%) far from optimal range`);
  }

  return { grade, reasons };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const feedstockQualityVision = {
  analyzeQualityFromPhotos,
  estimateYieldFromSatellite,
  batchAnalyzeQuality,
};

export default feedstockQualityVision;
