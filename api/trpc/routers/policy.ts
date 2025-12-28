/**
 * Policy Router - Policy data operations
 */
import { policyRouter } from "../../../server/policyRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const policyOnlyRouter = router({ policy: policyRouter });

export default createServerRouterHandler(policyOnlyRouter, "/api/trpc/routers/policy");
