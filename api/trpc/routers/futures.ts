/**
 * Futures Router - Futures marketplace operations
 */
import { futuresRouter } from "../../../server/futuresRouter";
import { router } from "../../../server/_core/trpc";
import { createServerRouterHandler, vercelConfig } from "../../_lib/middleware";

export const config = vercelConfig;

const futuresOnlyRouter = router({ futures: futuresRouter });

export default createServerRouterHandler(futuresOnlyRouter, "/api/trpc/routers/futures");
