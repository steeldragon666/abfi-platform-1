/**
 * Automated Job Scheduler
 * Uses node-cron to schedule monitoring jobs at specific times
 */

import cron from 'node-cron';
import {
  dailyCovenantCheck,
  weeklySupplyRecalculation,
  contractRenewalAlerts,
} from './monitoringJobs';

// Track job status
export const jobStatus = {
  covenantCheck: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: 'scheduled' as 'scheduled' | 'running' | 'completed' | 'failed',
    lastResult: null as any,
  },
  supplyRecalc: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: 'scheduled' as 'scheduled' | 'running' | 'completed' | 'failed',
    lastResult: null as any,
  },
  renewalAlerts: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: 'scheduled' as 'scheduled' | 'running' | 'completed' | 'failed',
    lastResult: null as any,
  },
};

/**
 * Daily Covenant Check
 * Runs every day at 6:00 AM
 * Cron: 0 6 * * * (minute=0, hour=6, every day)
 */
const dailyCovenantCheckJob = cron.schedule('0 6 * * *', async () => {
  console.log('[Scheduler] Running daily covenant check at', new Date().toISOString());
  jobStatus.covenantCheck.status = 'running';
  
  try {
    const result = await dailyCovenantCheck();
    jobStatus.covenantCheck.lastRun = new Date();
    jobStatus.covenantCheck.status = 'completed';
    jobStatus.covenantCheck.lastResult = result;
    console.log('[Scheduler] Daily covenant check completed:', result);
  } catch (error) {
    jobStatus.covenantCheck.status = 'failed';
    console.error('[Scheduler] Daily covenant check failed:', error);
  }
}, {
  timezone: 'Australia/Sydney', // AEST/AEDT
});

/**
 * Weekly Supply Recalculation
 * Runs every Monday at 2:00 AM
 * Cron: 0 2 * * 1 (minute=0, hour=2, day-of-week=Monday)
 */
const weeklySupplyRecalcJob = cron.schedule('0 2 * * 1', async () => {
  console.log('[Scheduler] Running weekly supply recalculation at', new Date().toISOString());
  jobStatus.supplyRecalc.status = 'running';
  
  try {
    const result = await weeklySupplyRecalculation();
    jobStatus.supplyRecalc.lastRun = new Date();
    jobStatus.supplyRecalc.status = 'completed';
    jobStatus.supplyRecalc.lastResult = result;
    console.log('[Scheduler] Weekly supply recalculation completed:', result);
  } catch (error) {
    jobStatus.supplyRecalc.status = 'failed';
    console.error('[Scheduler] Weekly supply recalculation failed:', error);
  }
}, {
  timezone: 'Australia/Sydney',
});

/**
 * Contract Renewal Alerts
 * Runs every day at 7:00 AM
 * Cron: 0 7 * * * (minute=0, hour=7, every day)
 */
const contractRenewalAlertsJob = cron.schedule('0 7 * * *', async () => {
  console.log('[Scheduler] Running contract renewal alerts at', new Date().toISOString());
  jobStatus.renewalAlerts.status = 'running';
  
  try {
    const result = await contractRenewalAlerts();
    jobStatus.renewalAlerts.lastRun = new Date();
    jobStatus.renewalAlerts.status = 'completed';
    jobStatus.renewalAlerts.lastResult = result;
    console.log('[Scheduler] Contract renewal alerts completed:', result);
  } catch (error) {
    jobStatus.renewalAlerts.status = 'failed';
    console.error('[Scheduler] Contract renewal alerts failed:', error);
  }
}, {
  timezone: 'Australia/Sydney',
});

/**
 * Initialize scheduler
 * Starts all cron jobs and logs their schedules
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing automated job scheduler...');
  
  // Start all jobs
  dailyCovenantCheckJob.start();
  weeklySupplyRecalcJob.start();
  contractRenewalAlertsJob.start();
  
  console.log('[Scheduler] ✓ Daily Covenant Check scheduled for 6:00 AM daily (Australia/Sydney)');
  console.log('[Scheduler] ✓ Weekly Supply Recalculation scheduled for 2:00 AM Mondays (Australia/Sydney)');
  console.log('[Scheduler] ✓ Contract Renewal Alerts scheduled for 7:00 AM daily (Australia/Sydney)');
  console.log('[Scheduler] All jobs started successfully');
}

/**
 * Stop all scheduled jobs
 * Useful for graceful shutdown
 */
export function stopScheduler() {
  console.log('[Scheduler] Stopping all scheduled jobs...');
  dailyCovenantCheckJob.stop();
  weeklySupplyRecalcJob.stop();
  contractRenewalAlertsJob.stop();
  console.log('[Scheduler] All jobs stopped');
}

/**
 * Get current job status
 * Returns status of all scheduled jobs
 */
export function getJobStatus() {
  return {
    covenantCheck: {
      ...jobStatus.covenantCheck,
      schedule: 'Every day at 6:00 AM (Australia/Sydney)',
    },
    supplyRecalc: {
      ...jobStatus.supplyRecalc,
      schedule: 'Every Monday at 2:00 AM (Australia/Sydney)',
    },
    renewalAlerts: {
      ...jobStatus.renewalAlerts,
      schedule: 'Every day at 7:00 AM (Australia/Sydney)',
    },
  };
}
