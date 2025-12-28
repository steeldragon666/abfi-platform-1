/**
 * Supply Chain Router - Supply chain tracking operations
 */
import { supplyChainRouter } from "../../../server/supplyChainRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const supplyChainOnlyRouter = router({ supplyChain: supplyChainRouter });

export default createServerRouterHandler(supplyChainOnlyRouter, "/api/trpc/routers/supplyChain");
