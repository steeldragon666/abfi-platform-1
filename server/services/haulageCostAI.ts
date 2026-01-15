/**
 * Haulage Cost AI Service
 * Elevation-aware route optimization using DEM (Digital Elevation Model) data
 *
 * Features:
 * - Elevation profile analysis for route optimization
 * - Fuel consumption adjustment based on terrain
 * - Gradient-based cost modifiers
 * - Alternative route suggestions
 * - Weighbridge location recommendations
 *
 * Data Sources:
 * - Geoscience Australia Digital Elevation Model (5m resolution)
 * - National Topographic Database
 * - State road network data
 */

import { logger } from "../utils/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface ElevationProfile {
  startElevation: number;       // meters
  endElevation: number;
  maxElevation: number;
  minElevation: number;
  totalAscent: number;          // cumulative climb
  totalDescent: number;
  averageGradient: number;      // %
  maxGradient: number;          // %
  steepSections: SteepSection[];
}

export interface SteepSection {
  startKm: number;
  endKm: number;
  gradient: number;  // % grade
  length: number;    // km
  direction: "uphill" | "downhill";
}

export interface RouteAnalysis {
  route: GeoLocation[];
  distanceKm: number;
  estimatedTimeHours: number;
  elevationProfile: ElevationProfile;
  
  // Cost calculations
  baseFuelCostAud: number;
  elevationAdjustedFuelCostAud: number;
  fuelSavingsOrCost: number;     // Positive = extra cost, negative = savings
  
  // Fuel consumption
  baseFuelLitres: number;
  adjustedFuelLitres: number;
  fuelEfficiencyLPer100km: number;
  
  // Recommendations
  recommendations: RouteRecommendation[];
  alternativeRoutes?: AlternativeRoute[];
  weighbridgeStops: WeighbridgeLocation[];
}

export interface RouteRecommendation {
  type: "warning" | "optimization" | "info";
  message: string;
  savingsAud?: number;
}

export interface AlternativeRoute {
  name: string;
  description: string;
  distanceKm: number;
  estimatedTimeHours: number;
  fuelCostAud: number;
  comparedToBaseline: {
    distanceDiffKm: number;
    timeDiffHours: number;
    costDiffAud: number;
  };
}

export interface WeighbridgeLocation {
  name: string;
  location: GeoLocation;
  distanceFromRouteKm: number;
  type: "public" | "private" | "grain_receival";
  operatingHours?: string;
  maxCapacityTonnes?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Fuel consumption parameters
const FUEL_PARAMS = {
  baseLPer100km: 45,           // Base fuel consumption for B-double (flat terrain)
  dieselPriceAudPerL: 1.85,    // Current diesel price
  
  // Gradient adjustments (% increase per 1% gradient)
  uphillPenaltyPerPercent: 8,   // 8% extra fuel per 1% uphill gradient
  downhillBonusPerPercent: 2,   // 2% fuel saving per 1% downhill (limited by braking)
  
  // Load factors
  emptyFuelFactor: 0.7,         // Empty truck uses 70% of loaded fuel
  loadTonnesForBase: 40,        // Base calculation assumes 40t load
};

// Australian elevation data for major routes
// In production, would come from GA DEM tiles
const ROUTE_ELEVATIONS: Record<string, ElevationProfile> = {
  // Toowoomba Range - Uphill (Ipswich to Toowoomba)
  "toowoomba_range_uphill": {
    startElevation: 130,
    endElevation: 700,
    maxElevation: 710,
    minElevation: 130,
    totalAscent: 570,
    totalDescent: 0,
    averageGradient: 5.5,
    maxGradient: 10,
    steepSections: [
      { startKm: 0, endKm: 8, gradient: 7, length: 8, direction: "uphill" },
      { startKm: 8, endKm: 10, gradient: 10, length: 2, direction: "uphill" },
    ],
  },
  // Toowoomba Range - Downhill (Toowoomba to Ipswich)
  "toowoomba_range_downhill": {
    startElevation: 700,
    endElevation: 130,
    maxElevation: 710,
    minElevation: 130,
    totalAscent: 0,
    totalDescent: 570,
    averageGradient: -5.5,
    maxGradient: -10,
    steepSections: [
      { startKm: 0, endKm: 2, gradient: -10, length: 2, direction: "downhill" },
      { startKm: 2, endKm: 10, gradient: -7, length: 8, direction: "downhill" },
    ],
  },
  
  // Blue Mountains - Uphill (Sydney to Lithgow)
  "blue_mountains_uphill": {
    startElevation: 50,
    endElevation: 950,
    maxElevation: 1100,
    minElevation: 50,
    totalAscent: 1050,
    totalDescent: 150,
    averageGradient: 4.5,
    maxGradient: 8,
    steepSections: [
      { startKm: 20, endKm: 45, gradient: 5, length: 25, direction: "uphill" },
      { startKm: 60, endKm: 70, gradient: 8, length: 10, direction: "uphill" },
    ],
  },
  // Blue Mountains - Downhill (Lithgow to Sydney)
  "blue_mountains_downhill": {
    startElevation: 950,
    endElevation: 50,
    maxElevation: 1100,
    minElevation: 50,
    totalAscent: 150,
    totalDescent: 1050,
    averageGradient: -4.5,
    maxGradient: -8,
    steepSections: [
      { startKm: 0, endKm: 10, gradient: -8, length: 10, direction: "downhill" },
      { startKm: 25, endKm: 50, gradient: -5, length: 25, direction: "downhill" },
    ],
  },
  
  // Adelaide Hills - Uphill (Adelaide to Hills)
  "adelaide_hills_uphill": {
    startElevation: 20,
    endElevation: 450,
    maxElevation: 500,
    minElevation: 20,
    totalAscent: 480,
    totalDescent: 30,
    averageGradient: 4,
    maxGradient: 7,
    steepSections: [
      { startKm: 5, endKm: 15, gradient: 6, length: 10, direction: "uphill" },
    ],
  },
  // Adelaide Hills - Downhill (Hills to Adelaide)
  "adelaide_hills_downhill": {
    startElevation: 450,
    endElevation: 20,
    maxElevation: 500,
    minElevation: 20,
    totalAscent: 30,
    totalDescent: 480,
    averageGradient: -4,
    maxGradient: -7,
    steepSections: [
      { startKm: 0, endKm: 10, gradient: -6, length: 10, direction: "downhill" },
    ],
  },
  
  // Great Dividing Range - Westbound (coast to inland)
  "great_dividing_range_westbound": {
    startElevation: 200,
    endElevation: 800,
    maxElevation: 900,
    minElevation: 200,
    totalAscent: 700,
    totalDescent: 100,
    averageGradient: 3.5,
    maxGradient: 6,
    steepSections: [
      { startKm: 30, endKm: 50, gradient: 5, length: 20, direction: "uphill" },
    ],
  },
  // Great Dividing Range - Eastbound (inland to coast)
  "great_dividing_range_eastbound": {
    startElevation: 800,
    endElevation: 200,
    maxElevation: 900,
    minElevation: 200,
    totalAscent: 100,
    totalDescent: 700,
    averageGradient: -3.5,
    maxGradient: -6,
    steepSections: [
      { startKm: 0, endKm: 20, gradient: -5, length: 20, direction: "downhill" },
    ],
  },
  
  // Flat terrain (coastal/plains)
  "flat_terrain": {
    startElevation: 50,
    endElevation: 60,
    maxElevation: 80,
    minElevation: 40,
    totalAscent: 50,
    totalDescent: 40,
    averageGradient: 0.5,
    maxGradient: 2,
    steepSections: [],
  },
};

// Major weighbridge locations
const WEIGHBRIDGE_LOCATIONS: WeighbridgeLocation[] = [
  {
    name: "GrainCorp Moree",
    location: { latitude: -29.47, longitude: 149.84, name: "Moree" },
    distanceFromRouteKm: 0,
    type: "grain_receival",
    operatingHours: "6am-6pm",
    maxCapacityTonnes: 120,
  },
  {
    name: "Emerald Weighbridge",
    location: { latitude: -23.53, longitude: 148.16, name: "Emerald" },
    distanceFromRouteKm: 0,
    type: "public",
    operatingHours: "24/7",
    maxCapacityTonnes: 80,
  },
  {
    name: "Dalby Weighbridge",
    location: { latitude: -27.18, longitude: 151.26, name: "Dalby" },
    distanceFromRouteKm: 0,
    type: "public",
    operatingHours: "6am-10pm",
    maxCapacityTonnes: 100,
  },
  {
    name: "Toowoomba Weighbridge",
    location: { latitude: -27.56, longitude: 151.95, name: "Toowoomba" },
    distanceFromRouteKm: 0,
    type: "public",
    operatingHours: "24/7",
    maxCapacityTonnes: 100,
  },
  {
    name: "Bundaberg Weighbridge",
    location: { latitude: -24.87, longitude: 152.35, name: "Bundaberg" },
    distanceFromRouteKm: 0,
    type: "public",
    operatingHours: "6am-6pm",
    maxCapacityTonnes: 80,
  },
];

// ============================================================================
// HAULAGE COST AI SERVICE
// ============================================================================

/**
 * Calculate elevation-adjusted haulage cost for a route
 */
export async function calculateElevationAdjustedCost(
  origin: GeoLocation,
  destination: GeoLocation,
  loadTonnes: number = 40
): Promise<RouteAnalysis> {
  // Calculate base distance
  const distanceKm = calculateHaversineDistance(origin, destination);
  const roadDistanceKm = distanceKm * 1.3; // Road distance factor
  
  // Get elevation profile for route
  const elevationProfile = await getElevationProfile(origin, destination);
  
  // Calculate base fuel consumption (flat terrain)
  const baseFuelLitres = (roadDistanceKm / 100) * FUEL_PARAMS.baseLPer100km;
  const baseFuelCostAud = baseFuelLitres * FUEL_PARAMS.dieselPriceAudPerL;
  
  // Calculate elevation-adjusted fuel consumption
  let fuelAdjustmentFactor = 1.0;
  
  // Apply gradient adjustments
  if (elevationProfile.averageGradient > 0) {
    // Uphill increases fuel consumption
    const uphillPenalty = elevationProfile.averageGradient * (FUEL_PARAMS.uphillPenaltyPerPercent / 100);
    fuelAdjustmentFactor += uphillPenalty;
  } else {
    // Downhill provides slight savings
    const downhillBonus = Math.abs(elevationProfile.averageGradient) * (FUEL_PARAMS.downhillBonusPerPercent / 100);
    fuelAdjustmentFactor -= Math.min(downhillBonus, 0.15); // Cap at 15% savings
  }
  
  // Additional penalty for steep sections
  for (const section of elevationProfile.steepSections) {
    if (section.direction === "uphill" && section.gradient > 6) {
      // Extra penalty for very steep sections
      const steepPenalty = (section.length / roadDistanceKm) * (section.gradient - 6) * 0.05;
      fuelAdjustmentFactor += steepPenalty;
    }
  }
  
  // Adjust for load weight
  const loadFactor = loadTonnes / FUEL_PARAMS.loadTonnesForBase;
  fuelAdjustmentFactor *= 0.8 + (loadFactor * 0.2); // 80-100% based on load
  
  // Calculate adjusted values
  const adjustedFuelLitres = baseFuelLitres * fuelAdjustmentFactor;
  const elevationAdjustedFuelCostAud = adjustedFuelLitres * FUEL_PARAMS.dieselPriceAudPerL;
  const fuelSavingsOrCost = elevationAdjustedFuelCostAud - baseFuelCostAud;
  
  // Calculate efficiency
  const fuelEfficiencyLPer100km = (adjustedFuelLitres / roadDistanceKm) * 100;
  
  // Estimate time (assuming 80km/h average, slower on steep sections)
  let estimatedTimeHours = roadDistanceKm / 80;
  if (elevationProfile.maxGradient > 6) {
    // Add time for steep sections
    const steepKm = elevationProfile.steepSections.reduce((sum, s) => sum + s.length, 0);
    estimatedTimeHours += steepKm / 40; // Half speed on steep sections
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    elevationProfile,
    fuelAdjustmentFactor,
    roadDistanceKm,
    loadTonnes
  );
  
  // Find nearby weighbridges
  const weighbridgeStops = findNearbyWeighbridges(origin, destination);
  
  return {
    route: [origin, destination],
    distanceKm: roadDistanceKm,
    estimatedTimeHours: Math.round(estimatedTimeHours * 10) / 10,
    elevationProfile,
    baseFuelCostAud: Math.round(baseFuelCostAud * 100) / 100,
    elevationAdjustedFuelCostAud: Math.round(elevationAdjustedFuelCostAud * 100) / 100,
    fuelSavingsOrCost: Math.round(fuelSavingsOrCost * 100) / 100,
    baseFuelLitres: Math.round(baseFuelLitres * 10) / 10,
    adjustedFuelLitres: Math.round(adjustedFuelLitres * 10) / 10,
    fuelEfficiencyLPer100km: Math.round(fuelEfficiencyLPer100km * 10) / 10,
    recommendations,
    weighbridgeStops,
  };
}

/**
 * Get elevation profile for a route
 * In production, would query Geoscience Australia DEM tiles
 */
async function getElevationProfile(
  origin: GeoLocation,
  destination: GeoLocation
): Promise<ElevationProfile> {
  // Determine route characteristics based on locations
  const routeType = identifyRouteType(origin, destination);
  
  if (ROUTE_ELEVATIONS[routeType]) {
    return ROUTE_ELEVATIONS[routeType];
  }
  
  // Default to flat terrain for unknown routes
  return ROUTE_ELEVATIONS["flat_terrain"];
}

/**
 * Identify route type based on origin/destination
 * Returns route type with direction suffix (_uphill or _downhill) for steep routes
 */
function identifyRouteType(origin: GeoLocation, destination: GeoLocation): string {
  // Helper to check if location is in a region
  const isInIpswichArea = (loc: GeoLocation) => 
    loc.latitude > -27.8 && loc.latitude < -27.2 && loc.longitude > 152.5 && loc.longitude < 153;
  const isInToowoombaArea = (loc: GeoLocation) => 
    loc.latitude > -27.8 && loc.latitude < -27.2 && loc.longitude > 151.5 && loc.longitude < 152;
  
  const isInSydneyArea = (loc: GeoLocation) => 
    loc.latitude > -34.2 && loc.latitude < -33.5 && loc.longitude > 150.5;
  const isWestOfBlueMountains = (loc: GeoLocation) => loc.longitude < 150;
  
  const isInAdelaideArea = (loc: GeoLocation) =>
    loc.latitude > -35.2 && loc.latitude < -34.5 && loc.longitude > 138.7 && loc.longitude < 139;
  const isWestOfAdelaideHills = (loc: GeoLocation) => loc.longitude < 138.7;

  // Check for Toowoomba Range (bidirectional)
  if (isInIpswichArea(origin) && isInToowoombaArea(destination)) {
    return "toowoomba_range_uphill";
  }
  if (isInToowoombaArea(origin) && isInIpswichArea(destination)) {
    return "toowoomba_range_downhill";
  }
  
  // Check for Blue Mountains (bidirectional)
  if (isInSydneyArea(origin) && isWestOfBlueMountains(destination)) {
    return "blue_mountains_uphill";
  }
  if (isWestOfBlueMountains(origin) && isInSydneyArea(destination)) {
    return "blue_mountains_downhill";
  }
  
  // Check for Adelaide Hills (bidirectional)
  // isWestOfAdelaideHills identifies low-elevation coastal area (longitude < 138.7)
  // Going TO the coast (west) = downhill, going FROM the coast (east) = uphill
  if (isInAdelaideArea(origin) && isWestOfAdelaideHills(destination)) {
    return "adelaide_hills_downhill"; // Going west toward coast = descending
  }
  if (isWestOfAdelaideHills(origin) && isInAdelaideArea(destination)) {
    return "adelaide_hills_uphill"; // Coming from coast going east = ascending
  }
  
  // Check for Great Dividing Range crossing (general - bidirectional)
  if (origin.longitude > 150 && destination.longitude < 148) {
    return "great_dividing_range_westbound";
  }
  if (origin.longitude < 148 && destination.longitude > 150) {
    return "great_dividing_range_eastbound";
  }
  
  // Default to flat terrain
  return "flat_terrain";
}

/**
 * Generate route recommendations
 */
function generateRecommendations(
  profile: ElevationProfile,
  fuelFactor: number,
  distanceKm: number,
  loadTonnes: number
): RouteRecommendation[] {
  const recommendations: RouteRecommendation[] = [];
  
  // Steep gradient warnings
  if (profile.maxGradient > 8) {
    recommendations.push({
      type: "warning",
      message: `Route includes sections with ${profile.maxGradient}% gradient. Consider engine braking on descents.`,
    });
  }
  
  if (profile.maxGradient > 6 && loadTonnes > 35) {
    recommendations.push({
      type: "warning",
      message: "Heavy load on steep terrain. Ensure brake systems are in good condition.",
    });
  }
  
  // Fuel optimization suggestions
  if (fuelFactor > 1.2) {
    const extraCost = (fuelFactor - 1) * (distanceKm / 100) * FUEL_PARAMS.baseLPer100km * FUEL_PARAMS.dieselPriceAudPerL;
    recommendations.push({
      type: "optimization",
      message: `Terrain adds ${Math.round((fuelFactor - 1) * 100)}% to fuel costs. Consider alternative routes.`,
      savingsAud: Math.round(extraCost * 0.5), // Potential 50% savings with alt route
    });
  }
  
  // Early morning travel for steep sections
  if (profile.steepSections.length > 0) {
    recommendations.push({
      type: "info",
      message: "Steep sections present. Early morning travel recommended to avoid traffic delays.",
    });
  }
  
  // Rest stop suggestions for long routes
  if (distanceKm > 400) {
    recommendations.push({
      type: "info",
      message: "Long haul route. Mandatory rest stops required per fatigue management regulations.",
    });
  }
  
  return recommendations;
}

/**
 * Find weighbridges near the route
 */
function findNearbyWeighbridges(
  origin: GeoLocation,
  destination: GeoLocation
): WeighbridgeLocation[] {
  const nearby: WeighbridgeLocation[] = [];
  
  for (const wb of WEIGHBRIDGE_LOCATIONS) {
    // Check if weighbridge is near origin, destination, or along route
    const distToOrigin = calculateHaversineDistance(origin, wb.location);
    const distToDestination = calculateHaversineDistance(destination, wb.location);
    const routeDistance = calculateHaversineDistance(origin, destination);
    
    // Include if within 50km of either end or roughly along route
    const distViaWb = distToOrigin + distToDestination;
    const detour = distViaWb - routeDistance;
    
    if (distToOrigin < 50 || distToDestination < 50 || detour < 30) {
      nearby.push({
        ...wb,
        distanceFromRouteKm: Math.round(Math.min(distToOrigin, distToDestination, detour)),
      });
    }
  }
  
  // Sort by distance from route
  return nearby.sort((a, b) => a.distanceFromRouteKm - b.distanceFromRouteKm);
}

/**
 * Haversine distance calculation
 */
function calculateHaversineDistance(
  point1: GeoLocation,
  point2: GeoLocation
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
    Math.cos((point2.latitude * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const haulageCostAI = {
  calculateElevationAdjustedCost,
  findNearbyWeighbridges,
};

export default haulageCostAI;
