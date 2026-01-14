/**
 * Google Earth Engine Service
 * Provides satellite intelligence for ABFI Platform
 *
 * Features:
 * - NDVI (Normalized Difference Vegetation Index) analysis
 * - Vegetation health monitoring
 * - Soil moisture estimation
 * - Deforestation detection
 * - Land use classification
 */

// @ts-ignore - no type definitions available
import ee from "@google/earthengine";
import path from "path";
import fs from "fs";

// Service state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Configuration
const CREDENTIALS_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(process.cwd(), "server/credentials/earth-engine-key.json");

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "abfi-platform";

/**
 * Initialize Earth Engine with service account credentials
 */
export async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.warn(
          `[Earth Engine] Credentials file not found at ${CREDENTIALS_PATH}`
        );
        console.warn(
          "[Earth Engine] Running in demo mode - satellite data will be simulated"
        );
        isInitialized = true;
        resolve();
        return;
      }

      // Read service account credentials
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

      // Initialize Earth Engine
      ee.data.authenticateViaPrivateKey(
        credentials,
        () => {
          ee.initialize(
            null,
            null,
            () => {
              console.log("[Earth Engine] Successfully initialized");
              isInitialized = true;
              resolve();
            },
            (error: Error) => {
              console.error("[Earth Engine] Initialization failed:", error);
              reject(error);
            }
          );
        },
        (error: Error) => {
          console.error("[Earth Engine] Authentication failed:", error);
          reject(error);
        }
      );
    } catch (error) {
      console.error("[Earth Engine] Setup error:", error);
      reject(error);
    }
  });

  return initializationPromise;
}

/**
 * Check if Earth Engine is available (credentials configured)
 */
export function isEarthEngineAvailable(): boolean {
  return fs.existsSync(CREDENTIALS_PATH);
}

/**
 * Geographic bounds interface
 */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Point coordinates interface
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * NDVI Analysis Result
 */
export interface NDVIResult {
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  healthCategory: "excellent" | "good" | "moderate" | "poor" | "bare";
  timestamp: string;
  satellite: string;
}

/**
 * Vegetation Health Result
 */
export interface VegetationHealthResult {
  ndvi: number;
  evi: number; // Enhanced Vegetation Index
  lai: number; // Leaf Area Index estimate
  healthScore: number; // 0-100
  trend: "improving" | "stable" | "declining";
  alerts: string[];
}

/**
 * Soil Moisture Result
 */
export interface SoilMoistureResult {
  surfaceMoisture: number; // 0-1
  rootZoneMoisture: number; // 0-1
  moistureCategory: "saturated" | "wet" | "moist" | "dry" | "very_dry";
  droughtRisk: "low" | "moderate" | "high" | "severe";
}

/**
 * Calculate NDVI for a given location and time range
 */
export async function calculateNDVI(
  point: GeoPoint,
  startDate: string,
  endDate: string,
  radius: number = 500 // meters
): Promise<NDVIResult> {
  await initializeEarthEngine();

  if (!isEarthEngineAvailable()) {
    // Return simulated data in demo mode
    return generateDemoNDVI(point);
  }

  return new Promise((resolve, reject) => {
    try {
      // Create a point geometry with buffer
      const geometry = ee.Geometry.Point([point.lng, point.lat]).buffer(radius);

      // Get Sentinel-2 imagery
      const collection = ee
        .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(geometry)
        .filterDate(startDate, endDate)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        .select(["B4", "B8"]); // Red and NIR bands

      // Calculate NDVI
      const withNDVI = collection.map((image: any) => {
        const ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI");
        return image.addBands(ndvi);
      });

      // Get statistics
      const stats = withNDVI.select("NDVI").reduce(
        ee.Reducer.mean()
          .combine(ee.Reducer.min(), "", true)
          .combine(ee.Reducer.max(), "", true)
          .combine(ee.Reducer.stdDev(), "", true)
      );

      // Calculate mean over the area
      const result = stats.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9,
      });

      result.evaluate((data: any, error: Error) => {
        if (error) {
          reject(error);
          return;
        }

        const mean = data.NDVI_mean || 0;
        resolve({
          mean: mean,
          min: data.NDVI_min || 0,
          max: data.NDVI_max || 0,
          stdDev: data.NDVI_stdDev || 0,
          healthCategory: categorizeNDVI(mean),
          timestamp: new Date().toISOString(),
          satellite: "Sentinel-2",
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get vegetation health analysis
 */
export async function getVegetationHealth(
  point: GeoPoint,
  months: number = 6
): Promise<VegetationHealthResult> {
  await initializeEarthEngine();

  if (!isEarthEngineAvailable()) {
    return generateDemoVegetationHealth(point);
  }

  return new Promise((resolve, reject) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const geometry = ee.Geometry.Point([point.lng, point.lat]).buffer(500);

      // Get MODIS vegetation indices
      const modis = ee
        .ImageCollection("MODIS/061/MOD13A2")
        .filterBounds(geometry)
        .filterDate(startDate.toISOString(), endDate.toISOString())
        .select(["NDVI", "EVI"]);

      // Calculate mean values
      const meanImage = modis.mean();
      const stats = meanImage.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: geometry,
        scale: 250,
      });

      stats.evaluate((data: any, error: Error) => {
        if (error) {
          reject(error);
          return;
        }

        // MODIS NDVI is scaled by 10000
        const ndvi = (data.NDVI || 0) / 10000;
        const evi = (data.EVI || 0) / 10000;

        // Estimate LAI from NDVI (simplified model)
        const lai = estimateLAI(ndvi);

        // Calculate health score
        const healthScore = calculateHealthScore(ndvi, evi);

        resolve({
          ndvi,
          evi,
          lai,
          healthScore,
          trend: "stable", // Would need historical comparison
          alerts: generateVegetationAlerts(ndvi, evi),
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get soil moisture estimation
 */
export async function getSoilMoisture(
  point: GeoPoint
): Promise<SoilMoistureResult> {
  await initializeEarthEngine();

  if (!isEarthEngineAvailable()) {
    return generateDemoSoilMoisture(point);
  }

  return new Promise((resolve, reject) => {
    try {
      const geometry = ee.Geometry.Point([point.lng, point.lat]).buffer(1000);

      // Use SMAP soil moisture data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const smap = ee
        .ImageCollection("NASA/SMAP/SPL4SMGP/007")
        .filterBounds(geometry)
        .filterDate(startDate.toISOString(), endDate.toISOString())
        .select(["sm_surface", "sm_rootzone"]);

      const meanMoisture = smap.mean();
      const stats = meanMoisture.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: geometry,
        scale: 9000,
      });

      stats.evaluate((data: any, error: Error) => {
        if (error) {
          reject(error);
          return;
        }

        const surfaceMoisture = data.sm_surface || 0.2;
        const rootZoneMoisture = data.sm_rootzone || 0.25;

        resolve({
          surfaceMoisture,
          rootZoneMoisture,
          moistureCategory: categorizeMoisture(surfaceMoisture),
          droughtRisk: assessDroughtRisk(surfaceMoisture, rootZoneMoisture),
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get land cover classification for an area
 */
export async function getLandCover(
  bounds: GeoBounds
): Promise<Record<string, number>> {
  await initializeEarthEngine();

  if (!isEarthEngineAvailable()) {
    return generateDemoLandCover();
  }

  return new Promise((resolve, reject) => {
    try {
      const geometry = ee.Geometry.Rectangle([
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north,
      ]);

      // Use Dynamic World land cover
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const dynamicWorld = ee
        .ImageCollection("GOOGLE/DYNAMICWORLD/V1")
        .filterBounds(geometry)
        .filterDate(startDate.toISOString(), endDate.toISOString())
        .select("label");

      // Get mode (most common) land cover
      const mode = dynamicWorld.mode();

      // Calculate area of each class
      const areaImage = ee.Image.pixelArea().addBands(mode);

      const areas = areaImage.reduceRegion({
        reducer: ee.Reducer.sum().group({
          groupField: 1,
          groupName: "class",
        }),
        geometry: geometry,
        scale: 10,
        maxPixels: 1e9,
      });

      areas.evaluate((data: any, error: Error) => {
        if (error) {
          reject(error);
          return;
        }

        const landCoverClasses: Record<number, string> = {
          0: "water",
          1: "trees",
          2: "grass",
          3: "flooded_vegetation",
          4: "crops",
          5: "shrub_scrub",
          6: "built",
          7: "bare",
          8: "snow_ice",
        };

        const result: Record<string, number> = {};
        const groups = data.groups || [];

        for (const group of groups) {
          const className = landCoverClasses[group.class] || "unknown";
          result[className] = group.sum / 1e6; // Convert to km²
        }

        resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions

function categorizeNDVI(
  ndvi: number
): "excellent" | "good" | "moderate" | "poor" | "bare" {
  if (ndvi >= 0.6) return "excellent";
  if (ndvi >= 0.4) return "good";
  if (ndvi >= 0.2) return "moderate";
  if (ndvi >= 0.1) return "poor";
  return "bare";
}

function categorizeMoisture(
  moisture: number
): "saturated" | "wet" | "moist" | "dry" | "very_dry" {
  if (moisture >= 0.4) return "saturated";
  if (moisture >= 0.3) return "wet";
  if (moisture >= 0.2) return "moist";
  if (moisture >= 0.1) return "dry";
  return "very_dry";
}

function assessDroughtRisk(
  surface: number,
  rootZone: number
): "low" | "moderate" | "high" | "severe" {
  const avg = (surface + rootZone) / 2;
  if (avg >= 0.3) return "low";
  if (avg >= 0.2) return "moderate";
  if (avg >= 0.1) return "high";
  return "severe";
}

function estimateLAI(ndvi: number): number {
  // Simplified LAI estimation from NDVI
  // LAI = -ln((0.69 - NDVI) / 0.59) / 0.91
  if (ndvi <= 0.1) return 0;
  const lai = -Math.log((0.69 - Math.min(ndvi, 0.68)) / 0.59) / 0.91;
  return Math.max(0, Math.min(lai, 8));
}

function calculateHealthScore(ndvi: number, evi: number): number {
  // Combine NDVI and EVI for health score
  const ndviScore = Math.min(ndvi / 0.8, 1) * 60;
  const eviScore = Math.min(evi / 0.6, 1) * 40;
  return Math.round(ndviScore + eviScore);
}

function generateVegetationAlerts(ndvi: number, evi: number): string[] {
  const alerts: string[] = [];
  if (ndvi < 0.2) alerts.push("Low vegetation cover detected");
  if (ndvi < 0.1) alerts.push("Potential land degradation");
  if (evi < 0.1) alerts.push("Vegetation stress indicators present");
  return alerts;
}

// Demo data generators for when Earth Engine is not available

function generateDemoNDVI(point: GeoPoint): NDVIResult {
  // Generate deterministic demo NDVI based on approximate Australian geography
  const isCoastal = point.lng > 145 || point.lng < 120;
  const isTropical = point.lat > -20;

  let baseNDVI = 0.35;
  if (isCoastal) baseNDVI += 0.15;
  if (isTropical) baseNDVI += 0.1;

  // Deterministic variation based on coordinates
  const locationSeed = Math.abs(point.lat * 100 + point.lng * 10);
  const seededValue = (Math.sin(locationSeed) + 1) / 2; // 0 to 1
  const variation = (seededValue - 0.5) * 0.1;
  const mean = Math.max(0, Math.min(1, baseNDVI + variation));

  return {
    mean,
    min: mean - 0.1,
    max: mean + 0.15,
    stdDev: 0.08,
    healthCategory: categorizeNDVI(mean),
    timestamp: new Date().toISOString(),
    satellite: "Demo (Sentinel-2 simulation)",
  };
}

function generateDemoVegetationHealth(point: GeoPoint): VegetationHealthResult {
  const demo = generateDemoNDVI(point);
  const ndvi = demo.mean;
  const evi = ndvi * 0.8;

  return {
    ndvi,
    evi,
    lai: estimateLAI(ndvi),
    healthScore: calculateHealthScore(ndvi, evi),
    trend: "stable",
    alerts: generateVegetationAlerts(ndvi, evi),
  };
}

function generateDemoSoilMoisture(point: GeoPoint): SoilMoistureResult {
  // Generate deterministic soil moisture based on location
  const isWet = point.lng > 145 && point.lat > -30;
  const baseMoisture = isWet ? 0.28 : 0.18;
  
  // Deterministic variation based on coordinates
  const locationSeed = Math.abs(point.lat * 100 + point.lng * 10);
  const seededValue = (Math.sin(locationSeed + 5) + 1) / 2; // Different offset from NDVI
  const variation = (seededValue - 0.5) * 0.1;

  const surfaceMoisture = Math.max(0, Math.min(0.5, baseMoisture + variation));
  const rootZoneMoisture = surfaceMoisture * 1.1;

  return {
    surfaceMoisture,
    rootZoneMoisture,
    moistureCategory: categorizeMoisture(surfaceMoisture),
    droughtRisk: assessDroughtRisk(surfaceMoisture, rootZoneMoisture),
  };
}

function generateDemoLandCover(): Record<string, number> {
  return {
    crops: 45.2,
    grass: 28.5,
    trees: 12.3,
    shrub_scrub: 8.1,
    built: 3.5,
    water: 1.8,
    bare: 0.6,
  };
}

export default {
  initializeEarthEngine,
  isEarthEngineAvailable,
  calculateNDVI,
  getVegetationHealth,
  getSoilMoisture,
  getLandCover,
};
