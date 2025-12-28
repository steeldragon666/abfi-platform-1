/**
 * Prices Router - Feedstock price operations
 */
import { pricesRouter } from "../../../server/pricesRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const pricesOnlyRouter = router({ prices: pricesRouter });

export default createServerRouterHandler(pricesOnlyRouter, "/api/trpc/routers/prices");
