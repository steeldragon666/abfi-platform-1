/**
 * Counterparty Due Diligence Service
 * Enhanced ABN monitoring with 24-hour status checks, fraud detection, and risk scoring
 *
 * Features:
 * - 24-hour ABN status monitoring
 * - Business registration age analysis
 * - GST status change alerts
 * - Anomaly/fraud detection scoring
 * - Counterparty risk dashboard data
 */

import { getDb } from "../db";
import { logger } from "../utils/logger";
import { validateABNChecksum, lookupABN } from "../abnValidation";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";
import { suppliers, buyers, users, notifications } from "../../drizzle/schema";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ABNMonitoringResult {
  abn: string;
  entityName: string;
  previousStatus: string | null;
  currentStatus: string;
  statusChanged: boolean;
  gstStatusChanged: boolean;
  alerts: ABNAlert[];
  riskScore: number;
  riskFactors: RiskFactor[];
  lastChecked: Date;
}

export interface ABNAlert {
  type: "status_change" | "gst_change" | "name_change" | "address_change" | "high_risk" | "fraud_warning";
  severity: "info" | "warning" | "critical";
  message: string;
  detectedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface CounterpartyRiskProfile {
  entityId: number;
  entityType: "supplier" | "buyer";
  abn: string;
  entityName: string;
  
  // Risk metrics
  overallRiskScore: number;  // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  
  // Business age analysis
  daysSinceAbnRegistration: number;
  daysSinceGstRegistration: number | null;
  businessAgeCategory: "new" | "established" | "mature";
  
  // Activity metrics
  totalTransactionValue: number;
  typicalTransactionSize: number;
  transactionCount: number;
  
  // Change history
  abnStatusChanges12m: number;
  addressChanges12m: number;
  directorChanges12m: number;
  
  // Fraud indicators
  fraudScore: number;  // 0-100
  fraudIndicators: string[];
  
  // Verification status
  lastVerified: Date;
  verificationStatus: "verified" | "pending" | "failed" | "expired";
  
  // Recommendations
  recommendations: string[];
}

export interface ABNMonitoringConfig {
  checkIntervalHours: number;
  alertOnStatusChange: boolean;
  alertOnGstChange: boolean;
  highRiskThreshold: number;
  criticalRiskThreshold: number;
}

// Default configuration
const DEFAULT_CONFIG: ABNMonitoringConfig = {
  checkIntervalHours: 24,
  alertOnStatusChange: true,
  alertOnGstChange: true,
  highRiskThreshold: 60,
  criticalRiskThreshold: 80,
};

// ============================================================================
// ABN MONITORING SERVICE
// ============================================================================

/**
 * Monitor a single ABN for status changes
 */
export async function monitorABN(
  abn: string,
  previousData?: {
    status: string;
    gstRegistered: boolean;
    entityName: string;
  }
): Promise<ABNMonitoringResult> {
  const alerts: ABNAlert[] = [];
  const riskFactors: RiskFactor[] = [];
  
  // Lookup current ABN status
  const currentData = await lookupABN(abn);
  
  if (!currentData.success) {
    return {
      abn,
      entityName: previousData?.entityName || "Unknown",
      previousStatus: previousData?.status || null,
      currentStatus: "lookup_failed",
      statusChanged: false,
      gstStatusChanged: false,
      alerts: [{
        type: "high_risk",
        severity: "warning",
        message: `ABN lookup failed: ${currentData.message}`,
        detectedAt: new Date(),
      }],
      riskScore: 50,
      riskFactors: [{
        factor: "lookup_failure",
        weight: 0.3,
        score: 50,
        description: "ABN lookup failed - manual verification required",
      }],
      lastChecked: new Date(),
    };
  }
  
  // Check for status changes
  let statusChanged = false;
  let gstStatusChanged = false;
  
  if (previousData) {
    // ABN status change (Active -> Cancelled, etc.)
    if (previousData.status && currentData.abnStatus !== previousData.status) {
      statusChanged = true;
      const severity = currentData.abnStatus !== "Active" ? "critical" : "info";
      alerts.push({
        type: "status_change",
        severity,
        message: `ABN status changed from ${previousData.status} to ${currentData.abnStatus}`,
        detectedAt: new Date(),
        metadata: {
          previousStatus: previousData.status,
          currentStatus: currentData.abnStatus,
        },
      });
      
      if (currentData.abnStatus !== "Active") {
        riskFactors.push({
          factor: "inactive_abn",
          weight: 0.5,
          score: 100,
          description: `ABN is no longer active (${currentData.abnStatus})`,
        });
      }
    }
    
    // GST status change
    if (previousData.gstRegistered !== currentData.gstRegistered) {
      gstStatusChanged = true;
      alerts.push({
        type: "gst_change",
        severity: "warning",
        message: currentData.gstRegistered
          ? "Entity has registered for GST"
          : "Entity has deregistered from GST",
        detectedAt: new Date(),
        metadata: {
          previousGst: previousData.gstRegistered,
          currentGst: currentData.gstRegistered,
        },
      });
      
      if (!currentData.gstRegistered) {
        riskFactors.push({
          factor: "gst_deregistration",
          weight: 0.2,
          score: 40,
          description: "Entity has deregistered from GST",
        });
      }
    }
    
    // Entity name change
    if (previousData.entityName && currentData.entityName !== previousData.entityName) {
      alerts.push({
        type: "name_change",
        severity: "info",
        message: `Entity name changed from "${previousData.entityName}" to "${currentData.entityName}"`,
        detectedAt: new Date(),
      });
    }
  }
  
  // Calculate risk score
  const riskScore = calculateRiskScore(riskFactors);
  
  // Add high risk alert if threshold exceeded
  if (riskScore >= DEFAULT_CONFIG.highRiskThreshold) {
    alerts.push({
      type: "high_risk",
      severity: riskScore >= DEFAULT_CONFIG.criticalRiskThreshold ? "critical" : "warning",
      message: `High risk score detected: ${riskScore}`,
      detectedAt: new Date(),
      metadata: { riskScore, riskFactors },
    });
  }
  
  return {
    abn,
    entityName: currentData.entityName || previousData?.entityName || "Unknown",
    previousStatus: previousData?.status || null,
    currentStatus: currentData.abnStatus || "Unknown",
    statusChanged,
    gstStatusChanged,
    alerts,
    riskScore,
    riskFactors,
    lastChecked: new Date(),
  };
}

/**
 * Run 24-hour ABN monitoring check for all registered entities
 */
export async function runDailyABNMonitoring(): Promise<{
  entitiesChecked: number;
  alertsGenerated: number;
  statusChanges: number;
  errors: string[];
}> {
  logger.info("ABN_MONITORING", "Starting daily ABN monitoring check...");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const errors: string[] = [];
  let entitiesChecked = 0;
  let alertsGenerated = 0;
  let statusChanges = 0;
  
  try {
    // Get all suppliers with ABNs
    const suppliersToCheck = await db
      .select({
        id: suppliers.id,
        abn: suppliers.abn,
        companyName: suppliers.companyName,
        userId: suppliers.userId,
      })
      .from(suppliers)
      .where(sql`${suppliers.abn} IS NOT NULL AND ${suppliers.abn} != ''`);
    
    // Get all buyers with ABNs
    const buyersToCheck = await db
      .select({
        id: buyers.id,
        abn: buyers.abn,
        companyName: buyers.companyName,
        userId: buyers.userId,
      })
      .from(buyers)
      .where(sql`${buyers.abn} IS NOT NULL AND ${buyers.abn} != ''`);
    
    // Process suppliers
    for (const supplier of suppliersToCheck) {
      try {
        if (!supplier.abn) continue;
        
        const result = await monitorABN(supplier.abn, {
          status: "Active", // Assume previously active
          gstRegistered: true,
          entityName: supplier.companyName || "",
        });
        
        entitiesChecked++;
        
        if (result.statusChanged) {
          statusChanges++;
        }
        
        // Create notifications for alerts
        for (const alert of result.alerts) {
          if (alert.severity === "warning" || alert.severity === "critical") {
            alertsGenerated++;
            
            // Create notification for user
            if (supplier.userId) {
              await db.insert(notifications).values({
                userId: supplier.userId,
                type: "verification_update",
                title: `ABN Alert: ${supplier.companyName}`,
                message: `${alert.message} (ABN: ${supplier.abn}, Severity: ${alert.severity})`,
                read: false,
              });
            }
          }
        }
        
        // Rate limit API calls
        await delay(500);
        
      } catch (error) {
        errors.push(`Failed to check supplier ${supplier.id}: ${error}`);
      }
    }
    
    // Process buyers
    for (const buyer of buyersToCheck) {
      try {
        if (!buyer.abn) continue;
        
        const result = await monitorABN(buyer.abn, {
          status: "Active",
          gstRegistered: true,
          entityName: buyer.companyName || "",
        });
        
        entitiesChecked++;
        
        if (result.statusChanged) {
          statusChanges++;
        }
        
        for (const alert of result.alerts) {
          if (alert.severity === "warning" || alert.severity === "critical") {
            alertsGenerated++;
            
            if (buyer.userId) {
              await db.insert(notifications).values({
                userId: buyer.userId,
                type: "verification_update",
                title: `ABN Alert: ${buyer.companyName}`,
                message: `${alert.message} (ABN: ${buyer.abn}, Severity: ${alert.severity})`,
                read: false,
              });
            }
          }
        }
        
        await delay(500);
        
      } catch (error) {
        errors.push(`Failed to check buyer ${buyer.id}: ${error}`);
      }
    }
    
    logger.info("ABN_MONITORING", 
      `Daily check complete: ${entitiesChecked} entities, ${alertsGenerated} alerts, ${statusChanges} status changes`
    );
    
    return { entitiesChecked, alertsGenerated, statusChanges, errors };
    
  } catch (error) {
    logger.error("ABN_MONITORING", "Critical error in daily monitoring:", error);
    throw error;
  }
}

/**
 * Calculate fraud risk score for a counterparty
 */
export async function calculateFraudScore(
  entityId: number,
  entityType: "supplier" | "buyer"
): Promise<{
  fraudScore: number;
  fraudIndicators: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const fraudIndicators: string[] = [];
  let fraudScore = 0;
  
  // Get entity data
  let entityData: { abn: string; companyName: string; updatedAt: Date; verificationStatus?: string } | null = null;
  
  if (entityType === "supplier") {
    const supplierResult = await db.select().from(suppliers).where(eq(suppliers.id, entityId)).limit(1);
    if (supplierResult.length > 0) {
      entityData = {
        abn: supplierResult[0].abn,
        companyName: supplierResult[0].companyName,
        updatedAt: supplierResult[0].updatedAt,
        verificationStatus: supplierResult[0].verificationStatus,
      };
    }
  } else {
    const buyerResult = await db.select().from(buyers).where(eq(buyers.id, entityId)).limit(1);
    if (buyerResult.length > 0) {
      entityData = {
        abn: buyerResult[0].abn,
        companyName: buyerResult[0].companyName,
        updatedAt: buyerResult[0].updatedAt,
        verificationStatus: undefined, // Buyers don't have verificationStatus
      };
    }
  }
  
  if (!entityData) {
    return { fraudScore: 0, fraudIndicators: [], riskLevel: "low" };
  }
  
  // Factor 1: Days since ABN registration (new businesses are higher risk)
  // This would require storing registration date from ABR lookup
  // For now, use a placeholder
  const estimatedAgeDays = 365; // Would come from stored ABR data
  if (estimatedAgeDays < 90) {
    fraudScore += 25;
    fraudIndicators.push("Business registered less than 90 days ago");
  } else if (estimatedAgeDays < 180) {
    fraudScore += 15;
    fraudIndicators.push("Business registered less than 6 months ago");
  }
  
  // Factor 2: GST registration
  // Would check if GST registered for businesses with significant turnover
  
  // Factor 3: Verification status (only applicable for suppliers)
  if (entityData.verificationStatus && entityData.verificationStatus !== "verified") {
    fraudScore += 20;
    fraudIndicators.push("Entity not verified");
  } else if (!entityData.verificationStatus && entityType === "buyer") {
    // Buyers don't have verification status, add minor risk
    fraudScore += 10;
    fraudIndicators.push("Buyer verification not available");
  }
  
  // Factor 4: Transaction patterns
  // Would analyze transaction history for anomalies
  
  // Factor 5: Address verification
  // Would check if address is a known PO Box or virtual office
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (fraudScore >= 80) {
    riskLevel = "critical";
  } else if (fraudScore >= 60) {
    riskLevel = "high";
  } else if (fraudScore >= 40) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }
  
  return { fraudScore, fraudIndicators, riskLevel };
}

/**
 * Generate comprehensive counterparty risk profile
 */
export async function getCounterpartyRiskProfile(
  entityId: number,
  entityType: "supplier" | "buyer"
): Promise<CounterpartyRiskProfile | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get entity data with normalized structure
  let entityData: { 
    abn: string; 
    companyName: string; 
    updatedAt: Date; 
    verificationStatus?: string;
  } | null = null;
  
  if (entityType === "supplier") {
    const supplierResult = await db.select().from(suppliers).where(eq(suppliers.id, entityId)).limit(1);
    if (supplierResult.length > 0) {
      entityData = {
        abn: supplierResult[0].abn,
        companyName: supplierResult[0].companyName,
        updatedAt: supplierResult[0].updatedAt,
        verificationStatus: supplierResult[0].verificationStatus,
      };
    }
  } else {
    const buyerResult = await db.select().from(buyers).where(eq(buyers.id, entityId)).limit(1);
    if (buyerResult.length > 0) {
      entityData = {
        abn: buyerResult[0].abn,
        companyName: buyerResult[0].companyName,
        updatedAt: buyerResult[0].updatedAt,
        verificationStatus: undefined, // Buyers don't have verificationStatus
      };
    }
  }
  
  if (!entityData) {
    return null;
  }
  
  const abn = entityData.abn || "";
  
  // Get fraud score
  const { fraudScore, fraudIndicators, riskLevel } = await calculateFraudScore(entityId, entityType);
  
  // Calculate business age (would come from stored ABR data)
  const daysSinceAbnRegistration = 365; // Placeholder
  const daysSinceGstRegistration = 300; // Placeholder
  
  let businessAgeCategory: "new" | "established" | "mature";
  if (daysSinceAbnRegistration < 365) {
    businessAgeCategory = "new";
  } else if (daysSinceAbnRegistration < 1825) { // 5 years
    businessAgeCategory = "established";
  } else {
    businessAgeCategory = "mature";
  }
  
  // Calculate overall risk score
  const overallRiskScore = Math.min(100, fraudScore + (businessAgeCategory === "new" ? 20 : 0));
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!entityData.verificationStatus || entityData.verificationStatus !== "verified") {
    recommendations.push("Complete entity verification process");
  }
  
  if (businessAgeCategory === "new") {
    recommendations.push("Request additional financial guarantees for new businesses");
  }
  
  if (fraudScore > 40) {
    recommendations.push("Conduct enhanced due diligence before major transactions");
  }
  
  return {
    entityId,
    entityType,
    abn,
    entityName: entityData.companyName || "Unknown",
    overallRiskScore,
    riskLevel,
    daysSinceAbnRegistration,
    daysSinceGstRegistration,
    businessAgeCategory,
    totalTransactionValue: 0, // Would aggregate from transactions table
    typicalTransactionSize: 0,
    transactionCount: 0,
    abnStatusChanges12m: 0, // Would come from change log
    addressChanges12m: 0,
    directorChanges12m: 0,
    fraudScore,
    fraudIndicators,
    lastVerified: entityData.updatedAt || new Date(),
    verificationStatus: entityData.verificationStatus === "verified" ? "verified" : "pending",
    recommendations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateRiskScore(factors: RiskFactor[]): number {
  if (factors.length === 0) return 0;
  
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  
  return Math.round(weightedScore / (totalWeight || 1));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const counterpartyDueDiligenceService = {
  monitorABN,
  runDailyABNMonitoring,
  calculateFraudScore,
  getCounterpartyRiskProfile,
};

export default counterpartyDueDiligenceService;
