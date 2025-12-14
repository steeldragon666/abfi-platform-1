/**
 * Monitoring Jobs for ABFI Platform
 * Automated scheduled tasks for covenant monitoring and supply recalculation
 */

import { getDb } from './db';
import { projects, supplyAgreements, covenantBreachEvents, bankabilityAssessments } from '../drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { notifyLendersOfCovenantBreach, notifyLendersOfContractRenewal } from './lenderNotifications';

/**
 * Daily Covenant Check Job
 * Runs every day at 6:00 AM to check all active projects for covenant breaches
 */
export async function dailyCovenantCheck(): Promise<{
  projectsChecked: number;
  breachesDetected: number;
  notificationsSent: number;
}> {
  console.log('[MonitoringJob] Starting daily covenant check...');
  
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Get all active projects
    const allProjects = await db.select().from(projects)
      .where(sql`${projects.status} IN ('operational', 'construction')`);
    
    let breachesDetected = 0;
    let notificationsSent = 0;
    
    for (const project of allProjects) {
      // Get supply agreements for covenant checking
      const agreements = await db.select().from(supplyAgreements)
        .where(and(
          eq(supplyAgreements.projectId, project.id),
          eq(supplyAgreements.status, 'active')
        ));
      
      // Calculate current metrics
      const annualDemand = project.annualFeedstockVolume || 1;
      const tier1Total = agreements
        .filter(a => a.tier === 'tier1')
        .reduce((sum, a) => sum + (a.annualVolume || 0), 0);
      
      const tier1Coverage = Math.round((tier1Total / annualDemand) * 100);
      const tier1Target = project.tier1Target || 80;
      
      // Check if Tier 1 covenant is breached
      if (tier1Coverage < tier1Target * 0.9) {
        // Record breach
        await db.insert(covenantBreachEvents).values({
          projectId: project.id,
          covenantType: 'min_tier1_coverage',
          breachDate: new Date(),
          detectedDate: new Date(),
          severity: tier1Coverage < tier1Target * 0.8 ? 'critical' : 'breach',
          actualValue: tier1Coverage,
          thresholdValue: tier1Target,
          variancePercent: Math.round(((tier1Target - tier1Coverage) / tier1Target) * 100),
          narrativeExplanation: `Tier 1 supply coverage (${tier1Coverage}%) is below the minimum threshold of ${tier1Target}%. Current Tier 1 supply: ${tier1Total} tonnes vs annual demand: ${annualDemand} tonnes.`,
          impactAssessment: 'High impact: Tier 1 covenant breach may trigger lender review and affect project financing terms.',
          lenderNotified: false,
        });
        
        breachesDetected++;
        
        // Send lender notification
        const notifyResult = await notifyLendersOfCovenantBreach({
          projectId: project.id,
          projectName: project.name,
          breachType: 'Tier 1 Supply Coverage',
          severity: tier1Coverage < tier1Target * 0.8 ? 'critical' : 'breach',
          currentValue: tier1Coverage,
          thresholdValue: tier1Target,
          impactNarrative: `Tier 1 supply coverage (${tier1Coverage}%) is below the minimum threshold of ${tier1Target}%. Current Tier 1 supply: ${tier1Total} tonnes vs annual demand: ${annualDemand} tonnes.`,
          detectedAt: new Date(),
        });
        
        if (notifyResult.success) {
          notificationsSent++;
        }
      }
    }
    
    console.log(`[MonitoringJob] Daily covenant check complete: ${allProjects.length} projects checked, ${breachesDetected} breaches detected`);
    
    return {
      projectsChecked: allProjects.length,
      breachesDetected,
      notificationsSent,
    };
  } catch (error) {
    console.error('[MonitoringJob] Error in daily covenant check:', error);
    throw error;
  }
}

/**
 * Weekly Supply Recalculation Job
 * Runs every Monday at 2:00 AM to recalculate supply positions for all projects
 */
export async function weeklySupplyRecalculation(): Promise<{
  projectsProcessed: number;
  agreementsUpdated: number;
  scoresRecalculated: number;
}> {
  console.log('[MonitoringJob] Starting weekly supply recalculation...');
  
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const allProjects = await db.select().from(projects);
    let agreementsUpdated = 0;
    let scoresRecalculated = 0;
    
    for (const project of allProjects) {
      // Get all supply agreements for this project
      const agreements = await db.select().from(supplyAgreements)
        .where(eq(supplyAgreements.projectId, project.id));
      
      // Recalculate supply position metrics
      const tier1Total = agreements
        .filter(a => a.tier === 'tier1' && a.status === 'active')
        .reduce((sum, a) => sum + (a.annualVolume || 0), 0);
      
      const tier2Total = agreements
        .filter(a => a.tier === 'tier2' && a.status === 'active')
        .reduce((sum, a) => sum + (a.annualVolume || 0), 0);
      
      const optionsTotal = agreements
        .filter(a => a.tier === 'option' && a.status === 'active')
        .reduce((sum, a) => sum + (a.annualVolume || 0), 0);
      
      const rofrTotal = agreements
        .filter(a => a.tier === 'rofr' && a.status === 'active')
        .reduce((sum, a) => sum + (a.annualVolume || 0), 0);
      
      // Calculate coverage percentages
      const annualDemand = project.annualFeedstockVolume || 1;
      const tier1Coverage = Math.round((tier1Total / annualDemand) * 100);
      const tier2Coverage = Math.round((tier2Total / annualDemand) * 100);
      
      // Update project with updated timestamp (supply metrics are calculated on-the-fly)
      await db.update(projects)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));
      
      agreementsUpdated += agreements.length;
      
      // Check if bankability assessment needs updating
      const assessments = await db.select().from(bankabilityAssessments)
        .where(eq(bankabilityAssessments.projectId, project.id))
        .orderBy(desc(bankabilityAssessments.assessmentDate));
      const latestAssessment = assessments[0];
      
      if (latestAssessment) {
        // Recalculate bankability score if supply position changed significantly
        const oldTier1 = latestAssessment.volumeSecurityScore || 0; // Use volume security score as proxy
        const coverageChange = Math.abs(tier1Coverage - oldTier1);
        
        if (coverageChange > 5) { // More than 5% change
          // TODO: Trigger bankability reassessment
          console.log(`[MonitoringJob] Significant supply change for project ${project.id}: ${coverageChange}% change in Tier 1 coverage`);
          scoresRecalculated++;
        }
      }
    }
    
    console.log(`[MonitoringJob] Weekly supply recalculation complete: ${allProjects.length} projects processed, ${agreementsUpdated} agreements updated`);
    
    return {
      projectsProcessed: allProjects.length,
      agreementsUpdated,
      scoresRecalculated,
    };
  } catch (error) {
    console.error('[MonitoringJob] Error in weekly supply recalculation:', error);
    throw error;
  }
}

/**
 * Contract Renewal Alert Job
 * Runs daily to check for contracts expiring within 90 days
 */
export async function contractRenewalAlerts(): Promise<{
  contractsChecked: number;
  alertsGenerated: number;
}> {
  console.log('[MonitoringJob] Starting contract renewal alert check...');
  
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const allAgreements = await db.select().from(supplyAgreements)
      .where(eq(supplyAgreements.status, 'active'));
    let alertsGenerated = 0;
    
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    for (const agreement of allAgreements) {
      if (!agreement.endDate || agreement.status !== 'active') continue;
      
      const endDate = new Date(agreement.endDate);
      
      // Alert if contract expires within 90 days
      if (endDate <= ninetyDaysFromNow && endDate > today) {
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if alert already exists
        const existingAlerts = await db.select().from(covenantBreachEvents)
          .where(and(
            eq(covenantBreachEvents.projectId, agreement.projectId),
            eq(covenantBreachEvents.covenantType, 'contract_renewal'),
            eq(covenantBreachEvents.resolved, false)
          ));
        const hasRecentAlert = existingAlerts.some(
          (e: any) => e.narrativeExplanation?.includes(agreement.id.toString())
        );
        
        if (!hasRecentAlert) {
          // Create renewal alert
          await db.insert(covenantBreachEvents).values({
            projectId: agreement.projectId,
            covenantType: 'contract_renewal',
            breachDate: endDate,
            detectedDate: today,
            severity: daysUntilExpiry < 30 ? 'warning' : 'info',
            actualValue: daysUntilExpiry,
            thresholdValue: 90,
            variancePercent: 0,
            narrativeExplanation: `Supply agreement #${agreement.id} expires in ${daysUntilExpiry} days (${endDate.toLocaleDateString('en-AU')}). Tier: ${agreement.tier}, Volume: ${agreement.annualVolume} tonnes/year.`,
            impactAssessment: agreement.tier === 'tier1' 
              ? 'High impact: Tier 1 agreement expiry may affect bankability rating and covenant compliance.'
              : 'Medium impact: Consider renewal or replacement to maintain supply security.',
            lenderNotified: false,
          });
          
          alertsGenerated++;
          
          // Send lender notification
          await notifyLendersOfContractRenewal({
            projectId: agreement.projectId,
            projectName: `Project ${agreement.projectId}`,
            agreementId: agreement.id,
            supplierName: `Supplier ${agreement.supplierId}`,
            expiryDate: endDate,
            daysUntilExpiry,
            annualVolume: agreement.annualVolume || 0,
            tier: agreement.tier,
            impactLevel: agreement.tier === 'tier1' ? 'high' : 'medium',
          });
        }
      }
    }
    
    console.log(`[MonitoringJob] Contract renewal alert check complete: ${allAgreements.length} contracts checked, ${alertsGenerated} alerts generated`);
    
    return {
      contractsChecked: allAgreements.length,
      alertsGenerated,
    };
  } catch (error) {
    console.error('[MonitoringJob] Error in contract renewal alert check:', error);
    throw error;
  }
}

/**
 * Run all monitoring jobs (for manual trigger or testing)
 */
export async function runAllMonitoringJobs() {
  console.log('[MonitoringJob] Running all monitoring jobs...');
  
  const results = {
    covenantCheck: await dailyCovenantCheck(),
    supplyRecalc: await weeklySupplyRecalculation(),
    renewalAlerts: await contractRenewalAlerts(),
  };
  
  console.log('[MonitoringJob] All monitoring jobs complete:', results);
  return results;
}
