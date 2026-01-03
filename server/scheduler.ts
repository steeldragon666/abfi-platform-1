/**
 * Automated Job Scheduler
 * Uses node-cron to schedule monitoring jobs at specific times
 */

import cron from "node-cron";
import {
  dailyCovenantCheck,
  weeklySupplyRecalculation,
  contractRenewalAlerts,
} from "./monitoringJobs";
import {
  dailyAbaresIngestion,
  weeklyYieldPredictions,
  weeklySupplyForecasts,
  monthlyFarmBenchmarks,
} from "./abaresIngestionJobs";
import {
  dailySiloIngestion,
  hourlyObservationsIngestion,
  dailyForecastIngestion,
  monthlySeasonalOutlookIngestion,
  hourlyWarningsCheck,
  weeklyClimateMetricsCalculation,
} from "./bomIngestionJobs";

// Track job status
export const jobStatus = {
  covenantCheck: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  supplyRecalc: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  renewalAlerts: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  // ABARES Intelligence Jobs
  abaresDaily: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  abaresYieldPredictions: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  abaresSupplyForecasts: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  abaresFarmBenchmarks: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  // BOM Climate Data Jobs
  bomSiloDaily: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  bomObservationsHourly: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  bomForecastsDaily: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  bomSeasonalMonthly: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  bomWarningsHourly: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
  bomClimateMetricsWeekly: {
    lastRun: null as Date | null,
    nextRun: null as Date | null,
    status: "scheduled" as "scheduled" | "running" | "completed" | "failed",
    lastResult: null as any,
  },
};

/**
 * Daily Covenant Check
 * Runs every day at 6:00 AM
 * Cron: 0 6 * * * (minute=0, hour=6, every day)
 */
const dailyCovenantCheckJob = cron.schedule(
  "0 6 * * *",
  async () => {
    console.log(
      "[Scheduler] Running daily covenant check at",
      new Date().toISOString()
    );
    jobStatus.covenantCheck.status = "running";

    try {
      const result = await dailyCovenantCheck();
      jobStatus.covenantCheck.lastRun = new Date();
      jobStatus.covenantCheck.status = "completed";
      jobStatus.covenantCheck.lastResult = result;
      console.log("[Scheduler] Daily covenant check completed:", result);
    } catch (error) {
      jobStatus.covenantCheck.status = "failed";
      console.error("[Scheduler] Daily covenant check failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney", // AEST/AEDT
  }
);

/**
 * Weekly Supply Recalculation
 * Runs every Monday at 2:00 AM
 * Cron: 0 2 * * 1 (minute=0, hour=2, day-of-week=Monday)
 */
const weeklySupplyRecalcJob = cron.schedule(
  "0 2 * * 1",
  async () => {
    console.log(
      "[Scheduler] Running weekly supply recalculation at",
      new Date().toISOString()
    );
    jobStatus.supplyRecalc.status = "running";

    try {
      const result = await weeklySupplyRecalculation();
      jobStatus.supplyRecalc.lastRun = new Date();
      jobStatus.supplyRecalc.status = "completed";
      jobStatus.supplyRecalc.lastResult = result;
      console.log("[Scheduler] Weekly supply recalculation completed:", result);
    } catch (error) {
      jobStatus.supplyRecalc.status = "failed";
      console.error("[Scheduler] Weekly supply recalculation failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * Contract Renewal Alerts
 * Runs every day at 7:00 AM
 * Cron: 0 7 * * * (minute=0, hour=7, every day)
 */
const contractRenewalAlertsJob = cron.schedule(
  "0 7 * * *",
  async () => {
    console.log(
      "[Scheduler] Running contract renewal alerts at",
      new Date().toISOString()
    );
    jobStatus.renewalAlerts.status = "running";

    try {
      const result = await contractRenewalAlerts();
      jobStatus.renewalAlerts.lastRun = new Date();
      jobStatus.renewalAlerts.status = "completed";
      jobStatus.renewalAlerts.lastResult = result;
      console.log("[Scheduler] Contract renewal alerts completed:", result);
    } catch (error) {
      jobStatus.renewalAlerts.status = "failed";
      console.error("[Scheduler] Contract renewal alerts failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * ABARES Daily Data Ingestion
 * Runs every day at 5:00 AM (before covenant checks)
 * Cron: 0 5 * * * (minute=0, hour=5, every day)
 */
const abaresDailyIngestionJob = cron.schedule(
  "0 5 * * *",
  async () => {
    console.log(
      "[Scheduler] Running ABARES daily ingestion at",
      new Date().toISOString()
    );
    jobStatus.abaresDaily.status = "running";

    try {
      const result = await dailyAbaresIngestion();
      jobStatus.abaresDaily.lastRun = new Date();
      jobStatus.abaresDaily.status = "completed";
      jobStatus.abaresDaily.lastResult = result;
      console.log("[Scheduler] ABARES daily ingestion completed:", result);
    } catch (error) {
      jobStatus.abaresDaily.status = "failed";
      console.error("[Scheduler] ABARES daily ingestion failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * ABARES Weekly Yield Predictions
 * Runs every Sunday at 3:00 AM
 * Cron: 0 3 * * 0 (minute=0, hour=3, day-of-week=Sunday)
 */
const abaresYieldPredictionsJob = cron.schedule(
  "0 3 * * 0",
  async () => {
    console.log(
      "[Scheduler] Running ABARES yield predictions at",
      new Date().toISOString()
    );
    jobStatus.abaresYieldPredictions.status = "running";

    try {
      const result = await weeklyYieldPredictions();
      jobStatus.abaresYieldPredictions.lastRun = new Date();
      jobStatus.abaresYieldPredictions.status = "completed";
      jobStatus.abaresYieldPredictions.lastResult = result;
      console.log("[Scheduler] ABARES yield predictions completed:", result);
    } catch (error) {
      jobStatus.abaresYieldPredictions.status = "failed";
      console.error("[Scheduler] ABARES yield predictions failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * ABARES Weekly Supply Forecasts
 * Runs every Sunday at 4:00 AM
 * Cron: 0 4 * * 0 (minute=0, hour=4, day-of-week=Sunday)
 */
const abaresSupplyForecastsJob = cron.schedule(
  "0 4 * * 0",
  async () => {
    console.log(
      "[Scheduler] Running ABARES supply forecasts at",
      new Date().toISOString()
    );
    jobStatus.abaresSupplyForecasts.status = "running";

    try {
      const result = await weeklySupplyForecasts();
      jobStatus.abaresSupplyForecasts.lastRun = new Date();
      jobStatus.abaresSupplyForecasts.status = "completed";
      jobStatus.abaresSupplyForecasts.lastResult = result;
      console.log("[Scheduler] ABARES supply forecasts completed:", result);
    } catch (error) {
      jobStatus.abaresSupplyForecasts.status = "failed";
      console.error("[Scheduler] ABARES supply forecasts failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * ABARES Monthly Farm Benchmarks
 * Runs on 1st of each month at 2:00 AM
 * Cron: 0 2 1 * * (minute=0, hour=2, day=1, every month)
 */
const abaresFarmBenchmarksJob = cron.schedule(
  "0 2 1 * *",
  async () => {
    console.log(
      "[Scheduler] Running ABARES farm benchmarks at",
      new Date().toISOString()
    );
    jobStatus.abaresFarmBenchmarks.status = "running";

    try {
      const result = await monthlyFarmBenchmarks();
      jobStatus.abaresFarmBenchmarks.lastRun = new Date();
      jobStatus.abaresFarmBenchmarks.status = "completed";
      jobStatus.abaresFarmBenchmarks.lastResult = result;
      console.log("[Scheduler] ABARES farm benchmarks completed:", result);
    } catch (error) {
      jobStatus.abaresFarmBenchmarks.status = "failed";
      console.error("[Scheduler] ABARES farm benchmarks failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * BOM Daily SILO Data Ingestion
 * Runs every day at 4:30 AM (before ABARES)
 * Cron: 30 4 * * *
 */
const bomSiloDailyJob = cron.schedule(
  "30 4 * * *",
  async () => {
    console.log(
      "[Scheduler] Running BOM SILO daily ingestion at",
      new Date().toISOString()
    );
    jobStatus.bomSiloDaily.status = "running";

    try {
      const result = await dailySiloIngestion();
      jobStatus.bomSiloDaily.lastRun = new Date();
      jobStatus.bomSiloDaily.status = "completed";
      jobStatus.bomSiloDaily.lastResult = result;
      console.log("[Scheduler] BOM SILO daily ingestion completed:", result);
    } catch (error) {
      jobStatus.bomSiloDaily.status = "failed";
      console.error("[Scheduler] BOM SILO daily ingestion failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * BOM Hourly Observations
 * Runs every hour at minute 15
 * Cron: 15 * * * *
 */
const bomObservationsHourlyJob = cron.schedule(
  "15 * * * *",
  async () => {
    console.log(
      "[Scheduler] Running BOM observations at",
      new Date().toISOString()
    );
    jobStatus.bomObservationsHourly.status = "running";

    try {
      const result = await hourlyObservationsIngestion();
      jobStatus.bomObservationsHourly.lastRun = new Date();
      jobStatus.bomObservationsHourly.status = "completed";
      jobStatus.bomObservationsHourly.lastResult = result;
      console.log("[Scheduler] BOM observations completed:", result);
    } catch (error) {
      jobStatus.bomObservationsHourly.status = "failed";
      console.error("[Scheduler] BOM observations failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * BOM Daily Forecasts
 * Runs every day at 6:30 AM
 * Cron: 30 6 * * *
 */
const bomForecastsDailyJob = cron.schedule(
  "30 6 * * *",
  async () => {
    console.log(
      "[Scheduler] Running BOM forecasts at",
      new Date().toISOString()
    );
    jobStatus.bomForecastsDaily.status = "running";

    try {
      const result = await dailyForecastIngestion();
      jobStatus.bomForecastsDaily.lastRun = new Date();
      jobStatus.bomForecastsDaily.status = "completed";
      jobStatus.bomForecastsDaily.lastResult = result;
      console.log("[Scheduler] BOM forecasts completed:", result);
    } catch (error) {
      jobStatus.bomForecastsDaily.status = "failed";
      console.error("[Scheduler] BOM forecasts failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * BOM Monthly Seasonal Outlook
 * Runs on 2nd of each month at 3:00 AM
 * Cron: 0 3 2 * *
 */
const bomSeasonalMonthlyJob = cron.schedule(
  "0 3 2 * *",
  async () => {
    console.log(
      "[Scheduler] Running BOM seasonal outlook at",
      new Date().toISOString()
    );
    jobStatus.bomSeasonalMonthly.status = "running";

    try {
      const result = await monthlySeasonalOutlookIngestion();
      jobStatus.bomSeasonalMonthly.lastRun = new Date();
      jobStatus.bomSeasonalMonthly.status = "completed";
      jobStatus.bomSeasonalMonthly.lastResult = result;
      console.log("[Scheduler] BOM seasonal outlook completed:", result);
    } catch (error) {
      jobStatus.bomSeasonalMonthly.status = "failed";
      console.error("[Scheduler] BOM seasonal outlook failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * BOM Hourly Warnings Check
 * Runs every hour at minute 45
 * Cron: 45 * * * *
 */
const bomWarningsHourlyJob = cron.schedule(
  "45 * * * *",
  async () => {
    console.log(
      "[Scheduler] Running BOM warnings check at",
      new Date().toISOString()
    );
    jobStatus.bomWarningsHourly.status = "running";

    try {
      const result = await hourlyWarningsCheck();
      jobStatus.bomWarningsHourly.lastRun = new Date();
      jobStatus.bomWarningsHourly.status = "completed";
      jobStatus.bomWarningsHourly.lastResult = result;
      console.log("[Scheduler] BOM warnings check completed:", result);
    } catch (error) {
      jobStatus.bomWarningsHourly.status = "failed";
      console.error("[Scheduler] BOM warnings check failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * Weekly Climate Metrics Calculation
 * Runs every Monday at 3:30 AM
 * Cron: 30 3 * * 1
 */
const bomClimateMetricsWeeklyJob = cron.schedule(
  "30 3 * * 1",
  async () => {
    console.log(
      "[Scheduler] Running climate metrics calculation at",
      new Date().toISOString()
    );
    jobStatus.bomClimateMetricsWeekly.status = "running";

    try {
      const result = await weeklyClimateMetricsCalculation();
      jobStatus.bomClimateMetricsWeekly.lastRun = new Date();
      jobStatus.bomClimateMetricsWeekly.status = "completed";
      jobStatus.bomClimateMetricsWeekly.lastResult = result;
      console.log("[Scheduler] Climate metrics calculation completed:", result);
    } catch (error) {
      jobStatus.bomClimateMetricsWeekly.status = "failed";
      console.error("[Scheduler] Climate metrics calculation failed:", error);
    }
  },
  {
    timezone: "Australia/Sydney",
  }
);

/**
 * Initialize scheduler
 * Starts all cron jobs and logs their schedules
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing automated job scheduler...");

  // Start all monitoring jobs
  dailyCovenantCheckJob.start();
  weeklySupplyRecalcJob.start();
  contractRenewalAlertsJob.start();

  // Start all ABARES intelligence jobs
  abaresDailyIngestionJob.start();
  abaresYieldPredictionsJob.start();
  abaresSupplyForecastsJob.start();
  abaresFarmBenchmarksJob.start();

  // Start all BOM climate jobs
  bomSiloDailyJob.start();
  bomObservationsHourlyJob.start();
  bomForecastsDailyJob.start();
  bomSeasonalMonthlyJob.start();
  bomWarningsHourlyJob.start();
  bomClimateMetricsWeeklyJob.start();

  console.log("[Scheduler] Monitoring Jobs:");
  console.log(
    "  ✓ Daily Covenant Check scheduled for 6:00 AM daily (Australia/Sydney)"
  );
  console.log(
    "  ✓ Weekly Supply Recalculation scheduled for 2:00 AM Mondays (Australia/Sydney)"
  );
  console.log(
    "  ✓ Contract Renewal Alerts scheduled for 7:00 AM daily (Australia/Sydney)"
  );
  console.log("[Scheduler] ABARES Intelligence Jobs:");
  console.log(
    "  ✓ Daily ABARES Ingestion scheduled for 5:00 AM daily (Australia/Sydney)"
  );
  console.log(
    "  ✓ Weekly Yield Predictions scheduled for 3:00 AM Sundays (Australia/Sydney)"
  );
  console.log(
    "  ✓ Weekly Supply Forecasts scheduled for 4:00 AM Sundays (Australia/Sydney)"
  );
  console.log(
    "  ✓ Monthly Farm Benchmarks scheduled for 2:00 AM 1st of month (Australia/Sydney)"
  );
  console.log("[Scheduler] BOM Climate Jobs:");
  console.log(
    "  ✓ Daily SILO Ingestion scheduled for 4:30 AM daily (Australia/Sydney)"
  );
  console.log(
    "  ✓ Hourly Observations scheduled every hour at :15 (Australia/Sydney)"
  );
  console.log(
    "  ✓ Daily Forecasts scheduled for 6:30 AM daily (Australia/Sydney)"
  );
  console.log(
    "  ✓ Monthly Seasonal Outlook scheduled for 3:00 AM 2nd of month (Australia/Sydney)"
  );
  console.log(
    "  ✓ Hourly Warnings Check scheduled every hour at :45 (Australia/Sydney)"
  );
  console.log(
    "  ✓ Weekly Climate Metrics scheduled for 3:30 AM Mondays (Australia/Sydney)"
  );
  console.log("[Scheduler] All jobs started successfully");
}

/**
 * Stop all scheduled jobs
 * Useful for graceful shutdown
 */
export function stopScheduler() {
  console.log("[Scheduler] Stopping all scheduled jobs...");
  // Stop monitoring jobs
  dailyCovenantCheckJob.stop();
  weeklySupplyRecalcJob.stop();
  contractRenewalAlertsJob.stop();
  // Stop ABARES intelligence jobs
  abaresDailyIngestionJob.stop();
  abaresYieldPredictionsJob.stop();
  abaresSupplyForecastsJob.stop();
  abaresFarmBenchmarksJob.stop();
  // Stop BOM climate jobs
  bomSiloDailyJob.stop();
  bomObservationsHourlyJob.stop();
  bomForecastsDailyJob.stop();
  bomSeasonalMonthlyJob.stop();
  bomWarningsHourlyJob.stop();
  bomClimateMetricsWeeklyJob.stop();
  console.log("[Scheduler] All jobs stopped");
}

/**
 * Get current job status
 * Returns status of all scheduled jobs
 */
export function getJobStatus() {
  return {
    // Monitoring Jobs
    covenantCheck: {
      ...jobStatus.covenantCheck,
      schedule: "Every day at 6:00 AM (Australia/Sydney)",
    },
    supplyRecalc: {
      ...jobStatus.supplyRecalc,
      schedule: "Every Monday at 2:00 AM (Australia/Sydney)",
    },
    renewalAlerts: {
      ...jobStatus.renewalAlerts,
      schedule: "Every day at 7:00 AM (Australia/Sydney)",
    },
    // ABARES Intelligence Jobs
    abaresDaily: {
      ...jobStatus.abaresDaily,
      schedule: "Every day at 5:00 AM (Australia/Sydney)",
    },
    abaresYieldPredictions: {
      ...jobStatus.abaresYieldPredictions,
      schedule: "Every Sunday at 3:00 AM (Australia/Sydney)",
    },
    abaresSupplyForecasts: {
      ...jobStatus.abaresSupplyForecasts,
      schedule: "Every Sunday at 4:00 AM (Australia/Sydney)",
    },
    abaresFarmBenchmarks: {
      ...jobStatus.abaresFarmBenchmarks,
      schedule: "1st of each month at 2:00 AM (Australia/Sydney)",
    },
    // BOM Climate Jobs
    bomSiloDaily: {
      ...jobStatus.bomSiloDaily,
      schedule: "Every day at 4:30 AM (Australia/Sydney)",
    },
    bomObservationsHourly: {
      ...jobStatus.bomObservationsHourly,
      schedule: "Every hour at :15 (Australia/Sydney)",
    },
    bomForecastsDaily: {
      ...jobStatus.bomForecastsDaily,
      schedule: "Every day at 6:30 AM (Australia/Sydney)",
    },
    bomSeasonalMonthly: {
      ...jobStatus.bomSeasonalMonthly,
      schedule: "2nd of each month at 3:00 AM (Australia/Sydney)",
    },
    bomWarningsHourly: {
      ...jobStatus.bomWarningsHourly,
      schedule: "Every hour at :45 (Australia/Sydney)",
    },
    bomClimateMetricsWeekly: {
      ...jobStatus.bomClimateMetricsWeekly,
      schedule: "Every Monday at 3:30 AM (Australia/Sydney)",
    },
  };
}
