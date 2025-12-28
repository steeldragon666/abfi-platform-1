/**
 * Monitoring Jobs Router - Background job operations
 */
import { monitoringJobsRouter } from "../../../server/monitoringJobsRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const monitoringJobsOnlyRouter = router({ monitoringJobs: monitoringJobsRouter });

export default createServerRouterHandler(monitoringJobsOnlyRouter, "/api/trpc/routers/monitoringJobs");
