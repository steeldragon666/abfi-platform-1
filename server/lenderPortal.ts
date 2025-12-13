/**
 * Lender Portal Enhancement Module (Phase 7)
 * Institutional-grade monitoring and reporting
 */

import { getDb } from "./db.js";
import {
  covenantBreachEvents,
  lenderReports,
  lenderAccess,
  type InsertCovenantBreachEvent,
  type InsertLenderReport,
} from "../drizzle/schema.js";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Check covenant compliance and detect breaches
 */
export async function checkCovenantCompliance(params: {
  projectId: number;
  covenants: Array<{
    type: string;
    threshold: number;
  }>;
  currentMetrics: {
    tier1Coverage: number;
    tier2Coverage: number;
    hhi: number;
    supplyShortfall: number;
    minSupplierCount: number;
    actualSupplierCount: number;
  };
}): Promise<Array<{
  covenantType: string;
  compliant: boolean;
  actualValue: number;
  thresholdValue: number;
  variancePercent: number;
  severity: "info" | "warning" | "breach" | "critical";
}>> {
  const results: Array<{
    covenantType: string;
    compliant: boolean;
    actualValue: number;
    thresholdValue: number;
    variancePercent: number;
    severity: "info" | "warning" | "breach" | "critical";
  }> = [];

  for (const covenant of params.covenants) {
    let actualValue: number;
    let compliant = true;

    // Map covenant type to actual metric
    switch (covenant.type) {
      case "min_tier1_coverage":
        actualValue = params.currentMetrics.tier1Coverage;
        compliant = actualValue >= covenant.threshold;
        break;
      case "min_tier2_coverage":
        actualValue = params.currentMetrics.tier2Coverage;
        compliant = actualValue >= covenant.threshold;
        break;
      case "max_hhi":
        actualValue = params.currentMetrics.hhi;
        compliant = actualValue <= covenant.threshold;
        break;
      case "max_supply_shortfall":
        actualValue = params.currentMetrics.supplyShortfall;
        compliant = actualValue <= covenant.threshold;
        break;
      case "min_supplier_count":
        actualValue = params.currentMetrics.actualSupplierCount;
        compliant = actualValue >= covenant.threshold;
        break;
      default:
        continue;
    }

    // Calculate variance
    const variance = actualValue - covenant.threshold;
    const variancePercent = Math.round((Math.abs(variance) / covenant.threshold) * 100);

    // Determine severity
    let severity: "info" | "warning" | "breach" | "critical";
    if (compliant) {
      severity = variancePercent < 10 ? "warning" : "info"; // Close to threshold = warning
    } else {
      severity = variancePercent > 50 ? "critical" : variancePercent > 25 ? "breach" : "warning";
    }

    results.push({
      covenantType: covenant.type,
      compliant,
      actualValue,
      thresholdValue: covenant.threshold,
      variancePercent,
      severity,
    });
  }

  return results;
}

/**
 * Record covenant breach event
 */
export async function recordCovenantBreach(params: {
  projectId: number;
  covenantType: string;
  actualValue: number;
  thresholdValue: number;
  variancePercent: number;
  severity: "info" | "warning" | "breach" | "critical";
  narrativeExplanation?: string;
  impactAssessment?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(covenantBreachEvents).values({
    projectId: params.projectId,
    covenantType: params.covenantType,
    breachDate: new Date(),
    detectedDate: new Date(),
    severity: params.severity,
    actualValue: params.actualValue,
    thresholdValue: params.thresholdValue,
    variancePercent: params.variancePercent,
    narrativeExplanation: params.narrativeExplanation || null,
    impactAssessment: params.impactAssessment || null,
    resolved: false,
    lenderNotified: false,
  });

  return Number(result[0].insertId);
}

/**
 * Get covenant breach history for a project
 */
export async function getCovenantBreachHistory(projectId: number, options?: { unresolved?: boolean; since?: Date }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(covenantBreachEvents.projectId, projectId)];

  if (options?.unresolved) {
    conditions.push(eq(covenantBreachEvents.resolved, false));
  }

  if (options?.since) {
    conditions.push(gte(covenantBreachEvents.breachDate, options.since));
  }

  return await db
    .select()
    .from(covenantBreachEvents)
    .where(and(...conditions))
    .orderBy(desc(covenantBreachEvents.breachDate));
}

/**
 * Resolve covenant breach
 */
export async function resolveCovenantBreach(params: {
  breachId: number;
  resolutionNotes: string;
  resolvedBy: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(covenantBreachEvents)
    .set({
      resolved: true,
      resolvedDate: new Date(),
      resolutionNotes: params.resolutionNotes,
      resolvedBy: params.resolvedBy,
    })
    .where(eq(covenantBreachEvents.id, params.breachId));
}

/**
 * Get active alerts for a project
 */
export async function getActiveAlerts(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get unresolved breaches
  const breaches = await db
    .select()
    .from(covenantBreachEvents)
    .where(and(eq(covenantBreachEvents.projectId, projectId), eq(covenantBreachEvents.resolved, false)))
    .orderBy(desc(covenantBreachEvents.severity), desc(covenantBreachEvents.breachDate));

  return breaches.map((breach) => ({
    id: breach.id,
    type: "covenant_breach",
    severity: breach.severity,
    title: `Covenant Breach: ${breach.covenantType}`,
    message: breach.narrativeExplanation || `${breach.covenantType} breach detected`,
    date: breach.breachDate,
    actualValue: breach.actualValue,
    thresholdValue: breach.thresholdValue,
    variancePercent: breach.variancePercent,
  }));
}

/**
 * Generate monthly lender report
 */
export async function generateMonthlyReport(params: {
  projectId: number;
  reportMonth: string; // YYYY-MM
  generatedBy: number;
  executiveSummary?: string;
  scoreChangesNarrative?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [year, month] = params.reportMonth.split("-").map(Number);
  const quarter = Math.ceil(month / 3);

  // Get covenant compliance status
  const breaches = await getCovenantBreachHistory(params.projectId, {
    since: new Date(year, month - 1, 1),
  });

  const covenantComplianceStatus = {
    compliant: breaches.length === 0,
    breaches: breaches.filter((b) => b.severity === "breach" || b.severity === "critical").length,
    warnings: breaches.filter((b) => b.severity === "warning").length,
  };

  // Placeholder for supply position summary (would come from actual project data)
  const supplyPositionSummary = {
    tier1Coverage: 0,
    tier2Coverage: 0,
    totalSuppliers: 0,
    hhi: 0,
  };

  const result = await db.insert(lenderReports).values({
    projectId: params.projectId,
    reportMonth: params.reportMonth,
    reportYear: year,
    reportQuarter: quarter,
    generatedDate: new Date(),
    generatedBy: params.generatedBy,
    executiveSummary: params.executiveSummary || null,
    scoreChangesNarrative: params.scoreChangesNarrative || null,
    covenantComplianceStatus,
    supplyPositionSummary,
    evidenceCount: 0,
    evidenceTypes: [],
    status: "draft",
    recipientEmails: [],
  });

  return Number(result[0].insertId);
}

/**
 * Get latest report for a project
 */
export async function getLatestReport(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  const reports = await db
    .select()
    .from(lenderReports)
    .where(eq(lenderReports.projectId, projectId))
    .orderBy(desc(lenderReports.reportMonth))
    .limit(1);

  return reports[0] || null;
}

/**
 * Get all reports for a project
 */
export async function getProjectReports(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(lenderReports)
    .where(eq(lenderReports.projectId, projectId))
    .orderBy(desc(lenderReports.reportMonth));
}

/**
 * Finalize report (mark as ready to send)
 */
export async function finalizeReport(params: { reportId: number; reportPdfUrl?: string; evidencePackUrl?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(lenderReports)
    .set({
      status: "finalized",
      finalizedDate: new Date(),
      reportPdfUrl: params.reportPdfUrl || null,
      evidencePackUrl: params.evidencePackUrl || null,
    })
    .where(eq(lenderReports.id, params.reportId));
}

/**
 * Mark report as sent
 */
export async function markReportSent(reportId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(lenderReports)
    .set({
      status: "sent",
      sentDate: new Date(),
    })
    .where(eq(lenderReports.id, reportId));
}

/**
 * Get lender dashboard data
 */
export async function getLenderDashboardData(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get active alerts
  const alerts = await getActiveAlerts(projectId);

  // Get recent breaches (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBreaches = await getCovenantBreachHistory(projectId, { since: thirtyDaysAgo });

  // Get latest report
  const latestReport = await getLatestReport(projectId);

  return {
    alerts,
    recentBreaches,
    latestReport,
    summary: {
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
      unresolvedBreaches: recentBreaches.filter((b) => !b.resolved).length,
      lastReportDate: latestReport?.generatedDate || null,
    },
  };
}
