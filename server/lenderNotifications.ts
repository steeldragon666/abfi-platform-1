/**
 * Lender Email Notification System
 * Sends automated emails to lenders for covenant breaches and contract renewals
 */

import { notifyOwner } from './_core/notification';
import * as db from './db';

export interface LenderContact {
  id: number;
  lenderId: number;
  email: string;
  name: string;
  role: string;
  receiveAlerts: boolean;
}

export interface CovenantBreachNotification {
  projectId: number;
  projectName: string;
  breachType: string;
  severity: 'info' | 'warning' | 'breach' | 'critical';
  currentValue: number;
  thresholdValue: number;
  impactNarrative: string;
  detectedAt: Date;
}

export interface ContractRenewalNotification {
  projectId: number;
  projectName: string;
  agreementId: number;
  supplierName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  annualVolume: number;
  tier: string;
  impactLevel: 'low' | 'medium' | 'high';
}

/**
 * Send covenant breach notification to lenders
 */
export async function notifyLendersOfCovenantBreach(
  notification: CovenantBreachNotification
): Promise<{ success: boolean; notifiedCount: number }> {
  try {
    // Get project details to find associated lenders
    const project = await db.getProjectById(notification.projectId);
    if (!project) {
      console.error(`[LenderNotifications] Project ${notification.projectId} not found`);
      return { success: false, notifiedCount: 0 };
    }

    // For now, use the owner notification system as a fallback
    // In production, this would query a lenders table and send individual emails
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      breach: '🚨',
      critical: '🔴',
    };

    const emailContent = `
${severityEmoji[notification.severity]} Covenant Breach Alert

Project: ${notification.projectName}
Breach Type: ${notification.breachType}
Severity: ${notification.severity.toUpperCase()}

Current Value: ${notification.currentValue}
Threshold: ${notification.thresholdValue}

Impact Assessment:
${notification.impactNarrative}

Detected: ${notification.detectedAt.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}

Action Required: Review project covenant compliance and contact project sponsor if necessary.
    `.trim();

    // Send notification to project owner (lender representative)
    const sent = await notifyOwner({
      title: `Covenant Breach: ${notification.projectName}`,
      content: emailContent,
    });

    if (sent) {
      console.log(`[LenderNotifications] Covenant breach notification sent for project ${notification.projectId}`);
      return { success: true, notifiedCount: 1 };
    } else {
      console.error(`[LenderNotifications] Failed to send covenant breach notification for project ${notification.projectId}`);
      return { success: false, notifiedCount: 0 };
    }
  } catch (error) {
    console.error('[LenderNotifications] Error sending covenant breach notification:', error);
    return { success: false, notifiedCount: 0 };
  }
}

/**
 * Send contract renewal notification to lenders
 */
export async function notifyLendersOfContractRenewal(
  notification: ContractRenewalNotification
): Promise<{ success: boolean; notifiedCount: number }> {
  try {
    // Get project details
    const project = await db.getProjectById(notification.projectId);
    if (!project) {
      console.error(`[LenderNotifications] Project ${notification.projectId} not found`);
      return { success: false, notifiedCount: 0 };
    }

    const impactEmoji = {
      low: '📋',
      medium: '⚠️',
      high: '🚨',
    };

    const emailContent = `
${impactEmoji[notification.impactLevel]} Contract Renewal Alert

Project: ${notification.projectName}
Supplier: ${notification.supplierName}
Agreement Tier: ${notification.tier}

Expiry Date: ${notification.expiryDate.toLocaleDateString('en-AU')}
Days Until Expiry: ${notification.daysUntilExpiry}

Annual Volume: ${notification.annualVolume.toLocaleString()} tonnes
Impact Level: ${notification.impactLevel.toUpperCase()}

Action Required: ${
  notification.impactLevel === 'high'
    ? 'Immediate attention required. This is a Tier 1 agreement critical to project bankability.'
    : notification.impactLevel === 'medium'
    ? 'Review renewal status and coordinate with project sponsor.'
    : 'Monitor renewal progress.'
}

Please coordinate with the project sponsor to ensure timely contract renewal.
    `.trim();

    // Send notification to project owner (lender representative)
    const sent = await notifyOwner({
      title: `Contract Renewal: ${notification.projectName} - ${notification.supplierName}`,
      content: emailContent,
    });

    if (sent) {
      console.log(`[LenderNotifications] Contract renewal notification sent for project ${notification.projectId}, agreement ${notification.agreementId}`);
      return { success: true, notifiedCount: 1 };
    } else {
      console.error(`[LenderNotifications] Failed to send contract renewal notification for project ${notification.projectId}`);
      return { success: false, notifiedCount: 0 };
    }
  } catch (error) {
    console.error('[LenderNotifications] Error sending contract renewal notification:', error);
    return { success: false, notifiedCount: 0 };
  }
}

/**
 * Send batch covenant breach notifications
 */
export async function notifyLendersOfMultipleBreaches(
  breaches: CovenantBreachNotification[]
): Promise<{ success: boolean; notifiedCount: number; failedCount: number }> {
  let notifiedCount = 0;
  let failedCount = 0;

  for (const breach of breaches) {
    const result = await notifyLendersOfCovenantBreach(breach);
    if (result.success) {
      notifiedCount += result.notifiedCount;
    } else {
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    notifiedCount,
    failedCount,
  };
}

/**
 * Send batch contract renewal notifications
 */
export async function notifyLendersOfMultipleRenewals(
  renewals: ContractRenewalNotification[]
): Promise<{ success: boolean; notifiedCount: number; failedCount: number }> {
  let notifiedCount = 0;
  let failedCount = 0;

  for (const renewal of renewals) {
    const result = await notifyLendersOfContractRenewal(renewal);
    if (result.success) {
      notifiedCount += result.notifiedCount;
    } else {
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    notifiedCount,
    failedCount,
  };
}
