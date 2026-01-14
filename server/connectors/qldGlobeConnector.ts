/**
 * Queensland Globe Property Verification Connector
 * Fetches property boundaries, lot/plan data, and tenure information
 *
 * Data Sources:
 * - Queensland Globe: https://qldglobe.information.qld.gov.au/
 * - QSpatial: https://qldspatial.information.qld.gov.au/
 * - data.qld.gov.au (Open Data Portal)
 *
 * Key Datasets:
 * - Property boundaries (cadastre)
 * - Lot/Plan data with tenure types
 * - Native Title areas (ILUA)
 * - Road closures and restrictions
 * - Sugarcane production zones
 */

import {
  BaseConnector,
  ConnectorConfig,
  ConnectorResult,
  RawSignal,
} from "./baseConnector";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TenureType =
  | "freehold"
  | "leasehold"
  | "state_land"
  | "crown_land"
  | "native_title"
  | "reserve"
  | "unknown";

export interface LotPlanDetails {
  lotPlan: string;           // e.g., "123SP456789"
  lot: string;
  plan: string;
  planType: "SP" | "RP" | "BUP" | "GTP" | "CP" | "OTHER";
  localGovernment: string;
  parish?: string;
  county?: string;
  areaHa: number;
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  centroid?: {
    latitude: number;
    longitude: number;
  };
}

export interface TenureRecord {
  lotPlan: string;
  tenure: TenureType;
  tenureDescription: string;
  proprietor?: string;
  startDate?: Date;
  expiryDate?: Date;
  restrictions: TenureRestriction[];
  nativeTitle?: {
    iluaName?: string;
    tribunalFileNo?: string;
    status: "active" | "registered" | "pending" | "none";
  };
}

export interface TenureRestriction {
  type: "easement" | "covenant" | "vegetation" | "heritage" | "mining" | "other";
  description: string;
  registeredDate?: Date;
  referenceNumber?: string;
}

export interface PropertyVerificationResult {
  lotPlan: string;
  verified: boolean;
  verifiedAt: Date;

  // Property details
  property: LotPlanDetails;

  // Tenure information
  tenure: TenureRecord;

  // Risk assessment
  tenureIssues: TenureIssue[];
  feedstockOwnershipRights: OwnershipAssessment;

  // Geospatial
  boundaryPolygon?: GeoJSONPolygon;
}

export interface TenureIssue {
  severity: "info" | "warning" | "critical";
  issue: string;
  recommendation: string;
}

export interface OwnershipAssessment {
  canHarvestFeedstock: boolean;
  canEnterContracts: boolean;
  requiresConsent: string[];
  encumbrances: string[];
  confidence: number;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface RoadRestriction {
  roadName: string;
  segment: string;
  restrictionType: "weight_limit" | "width_limit" | "closure" | "permit_required";
  restriction: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  affectedVehicles: string[];
  alternateRoute?: string;
}

export interface SugarcaneProductionZone {
  zoneName: string;
  millRegion: string;
  millName: string;
  estimatedAreaHa: number;
  estimatedTrashAvailability: number;  // tonnes/year
  harvestSeason: { start: string; end: string };
  coordinates?: { latitude: number; longitude: number };
}

// ============================================================================
// QLD GLOBE CONNECTOR
// ============================================================================

export class QldGlobeConnector extends BaseConnector {
  private readonly qspatialUrl = "https://qldspatial.information.qld.gov.au/arcgis/rest/services";
  private readonly dataQldUrl = "https://www.data.qld.gov.au/api/3";

  constructor(config: ConnectorConfig) {
    super(config, "qld_globe");
  }

  /**
   * Fetch signals (for stealth discovery)
   */
  async fetchSignals(since?: Date): Promise<ConnectorResult> {
    const startTime = Date.now();
    const signals: RawSignal[] = [];
    const errors: string[] = [];

    try {
      this.log("Starting Queensland Globe property scan...");

      // Scan for new sugarcane zones or property changes
      const zones = await this.fetchSugarcaneZones();
      for (const zone of zones) {
        if (zone.estimatedTrashAvailability > 10000) {
          signals.push({
            sourceId: `qld-sugarcane-${zone.zoneName}`,
            title: `Sugarcane trash availability: ${zone.zoneName}`,
            description: `${zone.estimatedTrashAvailability.toLocaleString()} tonnes/year estimated trash availability in ${zone.millRegion}`,
            detectedAt: new Date(),
            entityName: zone.millName,
            signalType: "resource_estimate",
            signalWeight: 0.7,
            confidence: 0.8,
            rawData: zone as unknown as Record<string, unknown>,
            metadata: {
              region: zone.millRegion,
              trashAvailability: zone.estimatedTrashAvailability,
              harvestSeason: zone.harvestSeason,
            },
          });
        }
      }

      this.log(`Found ${signals.length} Queensland property signals`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      this.logError("Failed to fetch QLD Globe signals", error);
      errors.push(msg);
    }

    return {
      success: errors.length === 0,
      signalsDiscovered: signals.length,
      signals,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Verify property ownership and tenure for a given lot/plan
   */
  async verifyProperty(lotPlan: string): Promise<PropertyVerificationResult> {
    this.log(`Verifying property: ${lotPlan}`);

    // Parse lot/plan
    const { lot, plan, planType } = this.parseLotPlan(lotPlan);

    // Fetch property details
    const property = await this.fetchLotPlanDetails(lotPlan);

    // Fetch tenure information
    const tenure = await this.fetchTenureRecord(lotPlan);

    // Assess tenure issues
    const tenureIssues = this.assessTenureIssues(tenure);

    // Assess feedstock ownership rights
    const feedstockOwnershipRights = this.assessOwnershipRights(tenure, tenureIssues);

    return {
      lotPlan,
      verified: true,
      verifiedAt: new Date(),
      property,
      tenure,
      tenureIssues,
      feedstockOwnershipRights,
      // boundaryPolygon would come from spatial API
    };
  }

  /**
   * Check if a property has native title or ILUA implications
   */
  async checkNativeTitle(
    latitude: number,
    longitude: number
  ): Promise<{
    hasActiveILUA: boolean;
    iluaDetails?: {
      tribunalFileNo: string;
      parties: string[];
      registrationDate: Date;
      expiryDate?: Date;
    };
    consultationRequired: boolean;
    riskLevel: "low" | "medium" | "high";
    recommendations: string[];
  }> {
    try {
      // In production, would query National Native Title Tribunal API
      // or QSpatial native title layer

      // For now, check if in known native title regions
      const isInNorthQld = latitude < -15 && longitude > 142 && longitude < 147;
      const isInCapeYork = latitude < -13;
      const isInOutback = longitude < 142;

      if (isInCapeYork) {
        return {
          hasActiveILUA: true,
          iluaDetails: {
            tribunalFileNo: "QI2010/001",
            parties: ["Traditional Owners", "Queensland Government"],
            registrationDate: new Date("2010-01-01"),
          },
          consultationRequired: true,
          riskLevel: "high",
          recommendations: [
            "Engage with Traditional Owner representatives before project development",
            "Obtain legal advice on ILUA requirements",
            "Include Traditional Owner consent in project timeline",
          ],
        };
      }

      if (isInNorthQld) {
        return {
          hasActiveILUA: false,
          consultationRequired: true,
          riskLevel: "medium",
          recommendations: [
            "Check for native title claims in vicinity",
            "Consider proactive engagement with Indigenous communities",
          ],
        };
      }

      return {
        hasActiveILUA: false,
        consultationRequired: false,
        riskLevel: "low",
        recommendations: [],
      };
    } catch (error) {
      this.logError("Failed to check native title", error);
      return {
        hasActiveILUA: false,
        consultationRequired: true,
        riskLevel: "medium",
        recommendations: ["Unable to verify - recommend manual native title search"],
      };
    }
  }

  /**
   * Fetch road restrictions affecting heavy vehicle access
   */
  async fetchRoadRestrictions(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<RoadRestriction[]> {
    try {
      // In production, would query TMR road restriction API
      // https://www.data.qld.gov.au/dataset/heavy-vehicle-access-restrictions

      // Return sample data for major routes
      const restrictions: RoadRestriction[] = [];

      // Check if in agricultural regions with known restrictions
      const isInDarlingDowns = latitude > -28.5 && latitude < -26.5 && longitude > 150 && longitude < 152;
      const isInMackayRegion = latitude > -22 && latitude < -20 && longitude > 148 && longitude < 150;

      if (isInMackayRegion) {
        restrictions.push({
          roadName: "Peak Downs Highway",
          segment: "Mackay to Nebo",
          restrictionType: "weight_limit",
          restriction: "Type 1 Road Train access - permit required for over-dimensional loads",
          effectiveFrom: new Date("2024-01-01"),
          affectedVehicles: ["B-Double", "Road Train"],
          alternateRoute: "Bruce Highway via Sarina",
        });
      }

      if (isInDarlingDowns) {
        restrictions.push({
          roadName: "Warrego Highway",
          segment: "Toowoomba Range",
          restrictionType: "weight_limit",
          restriction: "50t GVM limit on range section",
          affectedVehicles: ["Heavy combination vehicles"],
        });
      }

      return restrictions;
    } catch (error) {
      this.logError("Failed to fetch road restrictions", error);
      return [];
    }
  }

  /**
   * Fetch sugarcane production zones
   */
  async fetchSugarcaneZones(): Promise<SugarcaneProductionZone[]> {
    // Based on CANEGROWERS and Sugar Research Australia data
    const zones: SugarcaneProductionZone[] = [
      {
        zoneName: "Burdekin",
        millRegion: "North Queensland",
        millName: "Wilmar Sugar (Burdekin)",
        estimatedAreaHa: 75000,
        estimatedTrashAvailability: 900000, // ~12t/ha trash
        harvestSeason: { start: "June", end: "December" },
        coordinates: { latitude: -19.5, longitude: 147.2 },
      },
      {
        zoneName: "Herbert River",
        millRegion: "North Queensland",
        millName: "Wilmar Sugar (Herbert)",
        estimatedAreaHa: 62000,
        estimatedTrashAvailability: 744000,
        harvestSeason: { start: "June", end: "November" },
        coordinates: { latitude: -18.5, longitude: 146.2 },
      },
      {
        zoneName: "Mackay",
        millRegion: "Central Queensland",
        millName: "Mackay Sugar",
        estimatedAreaHa: 85000,
        estimatedTrashAvailability: 1020000,
        harvestSeason: { start: "June", end: "December" },
        coordinates: { latitude: -21.1, longitude: 149.2 },
      },
      {
        zoneName: "Proserpine",
        millRegion: "Central Queensland",
        millName: "Wilmar Sugar (Proserpine)",
        estimatedAreaHa: 18000,
        estimatedTrashAvailability: 216000,
        harvestSeason: { start: "June", end: "November" },
        coordinates: { latitude: -20.4, longitude: 148.6 },
      },
      {
        zoneName: "Bundaberg",
        millRegion: "Wide Bay",
        millName: "Bundaberg Sugar (various)",
        estimatedAreaHa: 45000,
        estimatedTrashAvailability: 540000,
        harvestSeason: { start: "July", end: "December" },
        coordinates: { latitude: -24.9, longitude: 152.3 },
      },
      {
        zoneName: "Isis",
        millRegion: "Wide Bay",
        millName: "Isis Central Sugar Mill",
        estimatedAreaHa: 22000,
        estimatedTrashAvailability: 264000,
        harvestSeason: { start: "July", end: "November" },
        coordinates: { latitude: -25.2, longitude: 152.4 },
      },
      {
        zoneName: "Maryborough",
        millRegion: "Wide Bay",
        millName: "MSF Sugar (Maryborough)",
        estimatedAreaHa: 15000,
        estimatedTrashAvailability: 180000,
        harvestSeason: { start: "July", end: "November" },
        coordinates: { latitude: -25.5, longitude: 152.7 },
      },
      {
        zoneName: "Rocky Point",
        millRegion: "South East Queensland",
        millName: "Rocky Point Mill",
        estimatedAreaHa: 3500,
        estimatedTrashAvailability: 42000,
        harvestSeason: { start: "July", end: "November" },
        coordinates: { latitude: -27.7, longitude: 153.3 },
      },
    ];

    return zones;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private parseLotPlan(lotPlan: string): { lot: string; plan: string; planType: string } {
    // Parse Queensland lot/plan format (e.g., "123SP456789", "45RP987654")
    const match = lotPlan.match(/^(\d+)(SP|RP|BUP|GTP|CP)(\d+)$/i);

    if (match) {
      return {
        lot: match[1],
        plan: match[3],
        planType: match[2].toUpperCase(),
      };
    }

    // Try alternate format with separators
    const altMatch = lotPlan.match(/^Lot\s*(\d+)\s*on\s*(SP|RP|BUP|GTP|CP)\s*(\d+)$/i);
    if (altMatch) {
      return {
        lot: altMatch[1],
        plan: altMatch[3],
        planType: altMatch[2].toUpperCase(),
      };
    }

    return { lot: "", plan: "", planType: "OTHER" };
  }

  private async fetchLotPlanDetails(lotPlan: string): Promise<LotPlanDetails> {
    const { lot, plan, planType } = this.parseLotPlan(lotPlan);

    // Deterministic values based on lot/plan identifiers
    const lotSeed = lot ? parseInt(lot, 10) || lot.charCodeAt(0) : 0;
    const planSeed = plan ? plan.charCodeAt(0) + (plan.charCodeAt(1) || 0) : 0;
    const combinedSeed = lotSeed + planSeed;
    
    // Deterministic pseudo-random based on seed
    const seededValue = (Math.sin(combinedSeed) + 1) / 2; // 0 to 1 range

    // In production, would query QSpatial cadastre layer
    // For now, return deterministic simulated data
    return {
      lotPlan,
      lot,
      plan,
      planType: planType as LotPlanDetails["planType"],
      localGovernment: "Example Regional Council",
      areaHa: Math.round((250 + seededValue * 500) * 10) / 10,
      centroid: {
        latitude: Math.round((-27 + seededValue * 5) * 10000) / 10000,
        longitude: Math.round((150 + seededValue * 3) * 10000) / 10000,
      },
    };
  }

  private async fetchTenureRecord(lotPlan: string): Promise<TenureRecord> {
    // In production, would query tenure register
    // For now, return simulated freehold record
    return {
      lotPlan,
      tenure: "freehold",
      tenureDescription: "Fee Simple (Freehold)",
      proprietor: "Registered Owner",
      restrictions: [],
    };
  }

  private assessTenureIssues(tenure: TenureRecord): TenureIssue[] {
    const issues: TenureIssue[] = [];

    // Check tenure type
    if (tenure.tenure === "leasehold") {
      issues.push({
        severity: "warning",
        issue: "Property is leasehold - feedstock rights may require lessor consent",
        recommendation: "Review lease terms for agricultural produce rights",
      });
    }

    if (tenure.tenure === "state_land" || tenure.tenure === "crown_land") {
      issues.push({
        severity: "critical",
        issue: "State/Crown land - commercial use requires permit",
        recommendation: "Apply for relevant permit through Department of Resources",
      });
    }

    if (tenure.tenure === "native_title") {
      issues.push({
        severity: "critical",
        issue: "Native title applies - ILUA or consent required",
        recommendation: "Engage with Traditional Owners and obtain ILUA before proceeding",
      });
    }

    // Check for restrictions
    for (const restriction of tenure.restrictions) {
      if (restriction.type === "vegetation") {
        issues.push({
          severity: "warning",
          issue: `Vegetation management restriction: ${restriction.description}`,
          recommendation: "Confirm feedstock collection complies with vegetation management plan",
        });
      }
      if (restriction.type === "heritage") {
        issues.push({
          severity: "info",
          issue: `Heritage restriction: ${restriction.description}`,
          recommendation: "Avoid heritage-listed areas during collection activities",
        });
      }
    }

    return issues;
  }

  private assessOwnershipRights(
    tenure: TenureRecord,
    issues: TenureIssue[]
  ): OwnershipAssessment {
    const criticalIssues = issues.filter(i => i.severity === "critical");
    const warningIssues = issues.filter(i => i.severity === "warning");

    const canHarvestFeedstock = tenure.tenure === "freehold" && criticalIssues.length === 0;
    const canEnterContracts = criticalIssues.length === 0;

    const requiresConsent: string[] = [];
    if (tenure.tenure === "leasehold") {
      requiresConsent.push("Lessor/Property owner");
    }
    if (tenure.nativeTitle?.status === "active") {
      requiresConsent.push("Traditional Owners (via ILUA)");
    }

    const encumbrances = tenure.restrictions.map(r => r.description);

    // Confidence based on issue count
    let confidence = 0.95;
    confidence -= criticalIssues.length * 0.2;
    confidence -= warningIssues.length * 0.05;
    confidence = Math.max(0.3, confidence);

    return {
      canHarvestFeedstock,
      canEnterContracts,
      requiresConsent,
      encumbrances,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createQldGlobeConnector(config?: Partial<ConnectorConfig>): QldGlobeConnector {
  return new QldGlobeConnector({
    name: "Queensland Globe Property Verification",
    enabled: true,
    rateLimit: 30,
    ...config,
  });
}
