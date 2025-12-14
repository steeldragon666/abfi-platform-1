/**
 * tRPC Router for Monitoring Jobs
 * Provides endpoints to trigger and schedule automated monitoring tasks
 */

import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import {
  dailyCovenantCheck,
  weeklySupplyRecalculation,
  contractRenewalAlerts,
  runAllMonitoringJobs,
} from './monitoringJobs';

export const monitoringJobsRouter = router({
  // Trigger daily covenant check manually
  triggerCovenantCheck: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await dailyCovenantCheck();
      return result;
    }),
  
  // Trigger weekly supply recalculation manually
  triggerSupplyRecalc: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await weeklySupplyRecalculation();
      return result;
    }),
  
  // Trigger contract renewal alerts manually
  triggerRenewalAlerts: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await contractRenewalAlerts();
      return result;
    }),
  
  // Run all monitoring jobs at once
  triggerAllJobs: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const results = await runAllMonitoringJobs();
      return results;
    }),
  
  // Get monitoring job status
  getJobStatus: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view job status
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // Import scheduler status dynamically to avoid circular dependencies
      const { getJobStatus } = await import('./scheduler');
      const status = getJobStatus();
      
      return {
        lastCovenantCheck: status.covenantCheck.lastRun,
        lastSupplyRecalc: status.supplyRecalc.lastRun,
        lastRenewalCheck: status.renewalAlerts.lastRun,
        scheduledJobs: [
          {
            name: 'Daily Covenant Check',
            schedule: status.covenantCheck.schedule,
            lastRun: status.covenantCheck.lastRun,
            nextRun: status.covenantCheck.nextRun,
            status: status.covenantCheck.status,
          },
          {
            name: 'Weekly Supply Recalculation',
            schedule: status.supplyRecalc.schedule,
            lastRun: status.supplyRecalc.lastRun,
            nextRun: status.supplyRecalc.nextRun,
            status: status.supplyRecalc.status,
          },
          {
            name: 'Contract Renewal Alerts',
            schedule: status.renewalAlerts.schedule,
            lastRun: status.renewalAlerts.lastRun,
            nextRun: status.renewalAlerts.nextRun,
            status: status.renewalAlerts.status,
          },
        ],
      };
    }),
});
